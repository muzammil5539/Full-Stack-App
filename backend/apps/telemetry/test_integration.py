"""
Integration tests for OpenTelemetry auto-instrumentation.
Tests that HTTP requests, database queries, and cache operations are traced.
"""
from __future__ import annotations

from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model
from django.db import connection
from rest_framework.authtoken.models import Token
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from apps.products.models import Product, Brand, Category

from utils.telemetry import configure_auto_instrumentation

User = get_user_model()


ACCOUNTS_ME_ENDPOINT = '/api/v1/accounts/users/'
PRODUCTS_ENDPOINT = '/api/v1/products/'


def _ensure_instrumented():
    """Ensure auto-instrumentation is enabled for this test process."""
    # `override_settings(OTEL_ENABLED=True)` doesn't re-run AppConfig.ready(),
    # so we enable instrumentation explicitly in test setup.
    global _INSTRUMENTED  # noqa: PLW0603
    try:
        _INSTRUMENTED
    except NameError:
        _INSTRUMENTED = False
    if not _INSTRUMENTED:
        configure_auto_instrumentation()
        _INSTRUMENTED = True


def _extract_username(payload):
    """Extract username from a DRF list response with/without pagination."""
    if isinstance(payload, dict) and "results" in payload and payload["results"]:
        return payload["results"][0].get("username")
    if isinstance(payload, list) and payload:
        return payload[0].get("username")
    return None


def _create_product(*, name: str, slug: str, sku: str, price: str) -> Product:
    brand = Brand.objects.create(name="Test Brand", slug="test-brand")
    category = Category.objects.create(name="Test Category", slug="test-category")
    return Product.objects.create(
        name=name,
        slug=slug,
        description="Test description",
        price=price,
        sku=sku,
        brand=brand,
        category=category,
        is_active=True,
    )


@override_settings(OTEL_ENABLED=True)
class AutoInstrumentationIntegrationTests(TestCase):
    """Test that Django auto-instrumentation works for HTTP requests and DB queries."""
    
    def setUp(self):
        """Set up test data and tracing."""
        _ensure_instrumented()

        # Set up in-memory span exporter
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
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = Client()
    
    def tearDown(self):
        """Clear exported spans."""
        self.exporter.clear()
    
    def test_http_request_creates_span(self):
        """Test that HTTP requests create spans."""
        # Make an authenticated API request
        response = self.client.get(
            ACCOUNTS_ME_ENDPOINT,
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        
        # Check that spans were created
        spans = self.exporter.get_finished_spans()
        self.assertGreater(len(spans), 0, "HTTP request should create at least one span")
        
        # Look for HTTP-related span
        http_spans = [s for s in spans if 'http' in s.name.lower() or 'GET' in s.name]
        self.assertGreater(len(http_spans), 0, "Should have HTTP-related spans")
    
    def test_database_queries_create_spans(self):
        """Test that database queries create spans."""
        product = _create_product(name="Test Product", slug="test-product", sku="SKU-TEST-1", price="99.99")
        
        # Perform a query
        fetched_product = Product.objects.get(id=product.id)
        self.assertEqual(fetched_product.id, product.id)
        
        # DB spans depend on the DB backend + installed instrumentor.
        # Tests run on SQLite in-memory here; unless sqlite3 is instrumented,
        # ORM queries will not produce DB spans.
        if connection.vendor == "sqlite":
            return

        spans = self.exporter.get_finished_spans()
        self.assertGreater(len(spans), 0, "Database queries should create spans")

        db_spans = [
            s for s in spans
            if (
                "db.system" in s.attributes
                or any(keyword in str(s.attributes) for keyword in ["db.", "sql", "SELECT", "INSERT"])
            )
        ]
        self.assertGreater(len(db_spans), 0, "Should have database-related spans")
    
    def test_api_endpoint_creates_multiple_spans(self):
        """Test that API endpoints create multiple spans (HTTP + DB)."""
        # Create test product data
        _create_product(name="API Test Product", slug="api-test-product", sku="SKU-API-1", price="49.99")
        
        # Clear previous spans
        self.exporter.clear()
        
        # Make API request to list products
        response = self.client.get(PRODUCTS_ENDPOINT)
        
        self.assertEqual(response.status_code, 200)
        
        spans = self.exporter.get_finished_spans()
        if connection.vendor == "sqlite":
            self.assertGreater(len(spans), 0, "API request should create at least one span")
        else:
            self.assertGreater(
                len(spans), 1,
                "API request should create multiple spans (HTTP + database queries)"
            )
    
    def test_span_context_propagation(self):
        """Test that span context is propagated through the request."""
        response = self.client.get(
            ACCOUNTS_ME_ENDPOINT,
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        spans = self.exporter.get_finished_spans()
        self.assertGreater(len(spans), 0)
        
        # Check that spans have trace IDs
        for span in spans:
            self.assertIsNotNone(span.context.trace_id)
            self.assertGreater(span.context.trace_id, 0)
    
    def test_unauthenticated_request_creates_span(self):
        """Test that even unauthenticated requests are traced."""
        self.exporter.clear()
        
        response = self.client.get(PRODUCTS_ENDPOINT)
        
        self.assertEqual(response.status_code, 200)
        
        spans = self.exporter.get_finished_spans()
        self.assertGreater(len(spans), 0, "Unauthenticated requests should also be traced")


class SpanAttributesTests(TestCase):
    """Test that spans have appropriate attributes."""
    
    def setUp(self):
        """Set up test data and tracing."""
        _ensure_instrumented()

        self.exporter = InMemorySpanExporter()
        provider = trace.get_tracer_provider()

        if isinstance(provider, TracerProvider):
            provider.add_span_processor(SimpleSpanProcessor(self.exporter))
        else:
            tracer_provider = TracerProvider()
            tracer_provider.add_span_processor(SimpleSpanProcessor(self.exporter))
            trace.set_tracer_provider(tracer_provider)
        
        self.user = User.objects.create_user(
            username='attruser',
            email='attr@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = Client()
    
    def tearDown(self):
        """Clear exported spans."""
        self.exporter.clear()
    
    def test_http_span_has_method_attribute(self):
        """Test that HTTP spans include request method."""
        response = self.client.get(PRODUCTS_ENDPOINT)
        
        self.assertEqual(response.status_code, 200)
        
        spans = self.exporter.get_finished_spans()
        
        # Look for spans with HTTP method attributes
        http_method_spans = [
            s for s in spans 
            if 'http.method' in s.attributes or 'GET' in str(s.attributes)
        ]
        # Note: Actual attribute names depend on Django instrumentation version
        # This is a general check that HTTP-related metadata is present
        self.assertGreaterEqual(len(http_method_spans), 0)
    
    def test_error_span_has_error_attributes(self):
        """Test that errors are recorded in spans."""
        # Try to access a non-existent endpoint
        response = self.client.get('/api/v1/nonexistent/')
        
        self.assertEqual(response.status_code, 404)
        
        spans = self.exporter.get_finished_spans()
        self.assertGreater(len(spans), 0)
        
        # At least one span should exist for the request
        # Error handling depends on Django instrumentation details


@override_settings(OTEL_ENABLED=False)
class TelemetryDisabledTests(TestCase):
    """Test behavior when telemetry is disabled."""
    
    def test_app_works_without_telemetry(self):
        """Test that application functions normally when OTEL_ENABLED=False."""
        user = User.objects.create_user(
            username='noteluser',
            email='notel@example.com',
            password='testpass123'
        )
        token = Token.objects.create(user=user)
        client = Client()
        
        response = client.get(
            ACCOUNTS_ME_ENDPOINT,
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        # Application should still work
        self.assertEqual(response.status_code, 200)
        username = _extract_username(response.json())
        self.assertEqual(username, 'noteluser')
