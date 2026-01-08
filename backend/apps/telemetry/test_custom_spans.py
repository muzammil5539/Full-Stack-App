"""
Tests for custom span utilities and decorators.
"""
from unittest import mock
from django.test import TestCase
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter


class CustomSpanTests(TestCase):
    """Test custom span decorators and utilities."""
    
    def setUp(self):
        """Set up test tracer with in-memory exporter."""
        self.exporter = InMemorySpanExporter()
        provider = trace.get_tracer_provider()

        # OpenTelemetry only allows setting the global provider once.
        # If it's already an SDK provider, attach our processor; otherwise set it.
        if isinstance(provider, TracerProvider):
            provider.add_span_processor(SimpleSpanProcessor(self.exporter))
        else:
            tracer_provider = TracerProvider()
            tracer_provider.add_span_processor(SimpleSpanProcessor(self.exporter))
            trace.set_tracer_provider(tracer_provider)
    
    def tearDown(self):
        """Clear exported spans."""
        self.exporter.clear()
    
    def test_trace_checkout_operation_success(self):
        """Test checkout operation decorator on successful operation."""
        from utils.tracing import trace_checkout_operation
        
        @trace_checkout_operation
        def mock_checkout():
            return mock.Mock(id=123, user_id=456)
        
        # Execute decorated function
        result = mock_checkout()
        
        # Verify result
        self.assertEqual(result.id, 123)
        self.assertEqual(result.user_id, 456)
        
        # Verify span was created
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.name, "checkout.mock_checkout")
        self.assertEqual(span.attributes.get("operation.type"), "checkout")
        self.assertEqual(span.attributes.get("operation.name"), "mock_checkout")
        self.assertEqual(span.attributes.get("checkout.success"), True)
        self.assertEqual(span.attributes.get("order.id"), "123")
        self.assertEqual(span.attributes.get("user.id"), "456")
    
    def test_trace_checkout_operation_failure(self):
        """Test checkout operation decorator on failed operation."""
        from utils.tracing import trace_checkout_operation
        
        @trace_checkout_operation
        def mock_checkout_failure():
            raise ValueError("Insufficient stock")
        
        # Execute decorated function and expect exception
        with self.assertRaises(ValueError) as context:
            mock_checkout_failure()
        
        self.assertEqual(str(context.exception), "Insufficient stock")
        
        # Verify span was created with error attributes
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.name, "checkout.mock_checkout_failure")
        self.assertEqual(span.attributes.get("checkout.success"), False)
        self.assertEqual(span.attributes.get("error.type"), "ValueError")
        self.assertEqual(span.attributes.get("error.message"), "Insufficient stock")
        
        # Verify exception was recorded
        events = list(span.events)
        self.assertTrue(any(event.name == "exception" for event in events))
    
    def test_trace_payment_operation_success(self):
        """Test payment operation decorator on successful operation."""
        from utils.tracing import trace_payment_operation
        
        @trace_payment_operation
        def mock_payment():
            return mock.Mock(
                id=789,
                order_id=123,
                payment_method="credit_card",
                amount="99.99"
            )
        
        result = mock_payment()
        
        # Verify span was created
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.name, "payment.mock_payment")
        self.assertEqual(span.attributes.get("operation.type"), "payment")
        self.assertEqual(span.attributes.get("payment.success"), True)
        self.assertEqual(span.attributes.get("payment.id"), "789")
        self.assertEqual(span.attributes.get("order.id"), "123")
        self.assertEqual(span.attributes.get("payment.method"), "credit_card")
        self.assertEqual(span.attributes.get("payment.amount"), "99.99")
    
    def test_trace_payment_operation_failure(self):
        """Test payment operation decorator on failed operation."""
        from utils.tracing import trace_payment_operation
        
        @trace_payment_operation
        def mock_payment_failure():
            raise Exception("Payment gateway timeout")
        
        with self.assertRaises(Exception) as context:
            mock_payment_failure()
        
        # Verify span with error
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.attributes.get("payment.success"), False)
        self.assertEqual(span.attributes.get("error.type"), "Exception")
        self.assertEqual(span.attributes.get("error.message"), "Payment gateway timeout")
    
    def test_trace_operation_context_manager_success(self):
        """Test trace_operation context manager on success."""
        from utils.tracing import trace_operation
        
        with trace_operation("validate_stock", {"product_id": "123"}):
            # Simulate some work
            pass
        
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.name, "validate_stock")
        self.assertEqual(span.attributes.get("product_id"), "123")
    
    def test_trace_operation_context_manager_failure(self):
        """Test trace_operation context manager on failure."""
        from utils.tracing import trace_operation
        
        with self.assertRaises(RuntimeError):
            with trace_operation("validate_stock", {"product_id": "456"}):
                raise RuntimeError("Stock validation failed")
        
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.attributes.get("error.type"), "RuntimeError")
        self.assertEqual(span.attributes.get("error.message"), "Stock validation failed")
    
    def test_add_order_created_event(self):
        """Test adding order created event to span."""
        from utils.tracing import add_order_created_event, get_tracer
        
        tracer = get_tracer("test")
        
        with tracer.start_as_current_span("test_span"):
            order = mock.Mock(
                id=123,
                status="pending",
                payment_status="unpaid",
                total="199.99",
                user_id=456
            )
            add_order_created_event(order)
        
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        events = list(span.events)
        self.assertTrue(any(event.name == "order.created" for event in events))
        
        # Find the order.created event
        order_event = next(e for e in events if e.name == "order.created")
        self.assertEqual(order_event.attributes.get("order.id"), "123")
        self.assertEqual(order_event.attributes.get("order.status"), "pending")
        self.assertEqual(order_event.attributes.get("order.total"), "199.99")
        self.assertEqual(order_event.attributes.get("user.id"), "456")
    
    def test_add_span_attributes(self):
        """Test adding attributes to current span."""
        from utils.tracing import add_span_attributes, get_tracer
        
        tracer = get_tracer("test")
        
        with tracer.start_as_current_span("test_span"):
            add_span_attributes({
                "user_id": 123,
                "product_id": "ABC",
                "quantity": 5,
                "nullable_field": None
            })
        
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        self.assertEqual(span.attributes.get("user_id"), "123")
        self.assertEqual(span.attributes.get("product_id"), "ABC")
        self.assertEqual(span.attributes.get("quantity"), "5")
        self.assertEqual(span.attributes.get("nullable_field"), "null")
    
    def test_add_span_event(self):
        """Test adding event to current span."""
        from utils.tracing import add_span_event, get_tracer
        
        tracer = get_tracer("test")
        
        with tracer.start_as_current_span("test_span"):
            add_span_event("custom_event", {
                "event_type": "user_action",
                "action": "button_click"
            })
        
        spans = self.exporter.get_finished_spans()
        self.assertEqual(len(spans), 1)
        
        span = spans[0]
        events = list(span.events)
        self.assertTrue(any(event.name == "custom_event" for event in events))
        
        custom_event = next(e for e in events if e.name == "custom_event")
        self.assertEqual(custom_event.attributes.get("event_type"), "user_action")
        self.assertEqual(custom_event.attributes.get("action"), "button_click")
    
    def test_add_span_attributes_without_active_span(self):
        """Test that add_span_attributes doesn't fail without active span."""
        from utils.tracing import add_span_attributes
        
        # Should not raise exception
        add_span_attributes({"test": "value"})
    
    def test_add_span_event_without_active_span(self):
        """Test that add_span_event doesn't fail without active span."""
        from utils.tracing import add_span_event
        
        # Should not raise exception
        add_span_event("test_event")


class MetricsRecordingTests(TestCase):
    """Test that decorators record metrics correctly."""
    
    @mock.patch('utils.tracing.checkout_started_counter')
    @mock.patch('utils.tracing.checkout_completed_counter')
    @mock.patch('utils.tracing.checkout_duration_histogram')
    def test_checkout_decorator_records_success_metrics(
        self,
        mock_duration,
        mock_completed,
        mock_started
    ):
        """Test that successful checkout records appropriate metrics."""
        from utils.tracing import trace_checkout_operation
        
        @trace_checkout_operation
        def mock_checkout():
            return mock.Mock(id=123)
        
        mock_checkout()
        
        # Verify metrics were recorded
        mock_started.add.assert_called_once()
        mock_completed.add.assert_called_once()
        mock_duration.record.assert_called_once()
        
        # Check attributes
        start_args, start_kwargs = mock_started.add.call_args
        start_attrs = None
        if len(start_args) >= 2:
            start_attrs = start_args[1]
        else:
            start_attrs = start_kwargs.get("attributes")
        self.assertIsInstance(start_attrs, dict)
        self.assertIn("operation", start_attrs)
        
        duration_args, duration_kwargs = mock_duration.record.call_args
        duration_attrs = None
        if len(duration_args) >= 2:
            duration_attrs = duration_args[1]
        else:
            duration_attrs = duration_kwargs.get("attributes")
        self.assertIsInstance(duration_attrs, dict)
        self.assertEqual(duration_attrs.get("status"), "success")
    
    @mock.patch('utils.tracing.checkout_started_counter')
    @mock.patch('utils.tracing.checkout_failed_counter')
    @mock.patch('utils.tracing.checkout_duration_histogram')
    def test_checkout_decorator_records_failure_metrics(
        self,
        mock_duration,
        mock_failed,
        mock_started
    ):
        """Test that failed checkout records appropriate metrics."""
        from utils.tracing import trace_checkout_operation
        
        @trace_checkout_operation
        def mock_checkout_failure():
            raise ValueError("Test error")
        
        with self.assertRaises(ValueError):
            mock_checkout_failure()
        
        # Verify metrics were recorded
        mock_started.add.assert_called_once()
        mock_failed.add.assert_called_once()
        mock_duration.record.assert_called_once()
        
        # Check error attributes
        failed_args, failed_kwargs = mock_failed.add.call_args
        failed_attrs = None
        if len(failed_args) >= 2:
            failed_attrs = failed_args[1]
        else:
            failed_attrs = failed_kwargs.get("attributes")
        self.assertIsInstance(failed_attrs, dict)
        self.assertEqual(failed_attrs.get("error_type"), "ValueError")
        
        duration_args, duration_kwargs = mock_duration.record.call_args
        duration_attrs = None
        if len(duration_args) >= 2:
            duration_attrs = duration_args[1]
        else:
            duration_attrs = duration_kwargs.get("attributes")
        self.assertIsInstance(duration_attrs, dict)
        self.assertEqual(duration_attrs.get("status"), "error")
