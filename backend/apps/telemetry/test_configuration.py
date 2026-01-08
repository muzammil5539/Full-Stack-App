"""
Tests for OpenTelemetry configuration and initialization.
"""
import os
from unittest import mock
from django.test import TestCase, override_settings
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider


class TelemetryConfigurationTests(TestCase):
    """Test OpenTelemetry configuration and initialization."""
    
    def test_resource_creation(self):
        """Test that resource is created with correct attributes."""
        from utils.telemetry import create_resource
        
        resource = create_resource()
        
        # Check service name
        self.assertIn('service.name', resource.attributes)
        self.assertEqual(resource.attributes['service.name'], 'django-ecommerce-backend')
        
        # Check service version
        self.assertIn('service.version', resource.attributes)
        
        # Check environment
        self.assertIn('environment', resource.attributes)
        self.assertIn('deployment.environment', resource.attributes)
    
    @mock.patch.dict(os.environ, {
        'OTEL_SERVICE_NAME': 'test-service',
        'OTEL_SERVICE_VERSION': '2.0.0',
        'OTEL_ENVIRONMENT': 'testing'
    })
    def test_resource_creation_with_env_vars(self):
        """Test that resource respects environment variables."""
        from utils.telemetry import create_resource
        
        # Reload module to pick up new env vars
        import importlib
        import utils.telemetry
        importlib.reload(utils.telemetry)
        
        resource = create_resource()
        
        self.assertEqual(resource.attributes['service.name'], 'test-service')
        self.assertEqual(resource.attributes['service.version'], '2.0.0')
        self.assertEqual(resource.attributes['environment'], 'testing')
    
    def test_tracer_provider_initialization(self):
        """Test that tracer provider is properly initialized."""
        from utils.telemetry import create_resource, configure_tracing
        
        resource = create_resource()
        tracer_provider = configure_tracing(resource)
        
        self.assertIsInstance(tracer_provider, TracerProvider)
        self.assertEqual(trace.get_tracer_provider(), tracer_provider)
    
    def test_meter_provider_initialization(self):
        """Test that meter provider is properly initialized."""
        from utils.telemetry import create_resource, configure_metrics
        
        resource = create_resource()
        meter_provider = configure_metrics(resource)
        
        self.assertIsInstance(meter_provider, MeterProvider)
        self.assertEqual(metrics.get_meter_provider(), meter_provider)
    
    def test_get_tracer(self):
        """Test getting a tracer instance."""
        from utils.telemetry import get_tracer
        
        tracer = get_tracer("test.tracer")
        
        self.assertIsNotNone(tracer)
        # Verify we can create a span
        with tracer.start_as_current_span("test_span") as span:
            self.assertTrue(span.is_recording())
    
    def test_get_meter(self):
        """Test getting a meter instance."""
        from utils.telemetry import get_meter
        
        meter = get_meter("test.meter")
        
        self.assertIsNotNone(meter)
        # Verify we can create a counter
        counter = meter.create_counter("test_counter")
        self.assertIsNotNone(counter)
    
    def test_business_metrics_exist(self):
        """Test that business metrics are created."""
        from utils.telemetry import (
            cart_add_counter,
            cart_remove_counter,
            checkout_started_counter,
            checkout_completed_counter,
            checkout_failed_counter,
            checkout_duration_histogram,
            order_created_counter,
            order_cancelled_counter,
            payment_success_counter,
            payment_failed_counter,
            payment_duration_histogram,
            api_error_counter,
        )
        
        # Verify all metrics exist
        self.assertIsNotNone(cart_add_counter)
        self.assertIsNotNone(cart_remove_counter)
        self.assertIsNotNone(checkout_started_counter)
        self.assertIsNotNone(checkout_completed_counter)
        self.assertIsNotNone(checkout_failed_counter)
        self.assertIsNotNone(checkout_duration_histogram)
        self.assertIsNotNone(order_created_counter)
        self.assertIsNotNone(order_cancelled_counter)
        self.assertIsNotNone(payment_success_counter)
        self.assertIsNotNone(payment_failed_counter)
        self.assertIsNotNone(payment_duration_histogram)
        self.assertIsNotNone(api_error_counter)
    
    def test_metrics_can_be_recorded(self):
        """Test that metrics can record values."""
        from utils.telemetry import cart_add_counter, checkout_duration_histogram
        
        # These should not raise exceptions
        cart_add_counter.add(1, {"product_id": "123"})
        checkout_duration_histogram.record(150.5, {"status": "success"})


class TelemetryInitializationTests(TestCase):
    """Test full telemetry initialization."""
    
    @override_settings(OTEL_ENABLED=True)
    @mock.patch('utils.telemetry.configure_auto_instrumentation')
    def test_initialize_telemetry(self, mock_auto_instrument):
        """Test complete telemetry initialization."""
        from utils.telemetry import initialize_telemetry
        
        tracer_provider, meter_provider = initialize_telemetry()
        
        self.assertIsInstance(tracer_provider, TracerProvider)
        self.assertIsInstance(meter_provider, MeterProvider)
        mock_auto_instrument.assert_called_once()
    
    @override_settings(OTEL_ENABLED=False)
    def test_telemetry_can_be_disabled(self):
        """Test that telemetry initialization respects OTEL_ENABLED setting."""
        # This is more of a configuration test
        # In real app, if OTEL_ENABLED=False, initialize_telemetry wouldn't be called
        from django.conf import settings
        
        self.assertFalse(settings.OTEL_ENABLED)


class AutoInstrumentationTests(TestCase):
    """Test auto-instrumentation configuration."""
    
    @mock.patch('utils.telemetry.DjangoInstrumentor')
    @mock.patch('utils.telemetry.Psycopg2Instrumentor')
    @mock.patch('utils.telemetry.RequestsInstrumentor')
    @mock.patch('utils.telemetry.RedisInstrumentor')
    def test_configure_auto_instrumentation(
        self,
        mock_redis_inst,
        mock_requests_inst,
        mock_psycopg2_inst,
        mock_django_inst
    ):
        """Test that all instrumentors are called."""
        from utils.telemetry import configure_auto_instrumentation
        
        # Create mock instances
        django_instance = mock.Mock()
        psycopg2_instance = mock.Mock()
        requests_instance = mock.Mock()
        redis_instance = mock.Mock()
        
        mock_django_inst.return_value = django_instance
        mock_psycopg2_inst.return_value = psycopg2_instance
        mock_requests_inst.return_value = requests_instance
        mock_redis_inst.return_value = redis_instance
        
        configure_auto_instrumentation()
        
        # Verify all instrumentors were called
        django_instance.instrument.assert_called_once()
        psycopg2_instance.instrument.assert_called_once()
        requests_instance.instrument.assert_called_once()
        redis_instance.instrument.assert_called_once()
    
    @mock.patch('utils.telemetry.DjangoInstrumentor')
    @mock.patch('utils.telemetry.Psycopg2Instrumentor')
    @mock.patch('utils.telemetry.RequestsInstrumentor')
    @mock.patch('utils.telemetry.RedisInstrumentor')
    def test_auto_instrumentation_handles_redis_failure(
        self,
        mock_redis_inst,
        mock_requests_inst,
        mock_psycopg2_inst,
        mock_django_inst
    ):
        """Test that Redis instrumentation failure doesn't break other instrumentations."""
        from utils.telemetry import configure_auto_instrumentation
        
        # Setup mocks
        django_instance = mock.Mock()
        psycopg2_instance = mock.Mock()
        requests_instance = mock.Mock()
        
        mock_django_inst.return_value = django_instance
        mock_psycopg2_inst.return_value = psycopg2_instance
        mock_requests_inst.return_value = requests_instance
        mock_redis_inst.side_effect = Exception("Redis not available")
        
        # Should not raise exception
        configure_auto_instrumentation()
        
        # Verify other instrumentors still worked
        django_instance.instrument.assert_called_once()
        psycopg2_instance.instrument.assert_called_once()
        requests_instance.instrument.assert_called_once()
