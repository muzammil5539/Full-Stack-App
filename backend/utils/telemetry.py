"""
OpenTelemetry configuration for Django application.

This module sets up distributed tracing, metrics collection, and logging
with proper instrumentation for Django, database, cache, and HTTP requests.
"""
import os
from typing import Optional

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor


# Configuration from environment variables
OTEL_SERVICE_NAME = os.getenv('OTEL_SERVICE_NAME', 'django-ecommerce-backend')
OTEL_SERVICE_VERSION = os.getenv('OTEL_SERVICE_VERSION', '1.0.0')
OTEL_EXPORTER_OTLP_ENDPOINT = os.getenv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4317')
OTEL_ENVIRONMENT = os.getenv('OTEL_ENVIRONMENT', 'development')
OTEL_CONSOLE_EXPORT = os.getenv('OTEL_CONSOLE_EXPORT', 'false').lower() == 'true'


def create_resource() -> Resource:
    """Create resource with service attributes."""
    return Resource.create({
        SERVICE_NAME: OTEL_SERVICE_NAME,
        SERVICE_VERSION: OTEL_SERVICE_VERSION,
        "environment": OTEL_ENVIRONMENT,
        "deployment.environment": OTEL_ENVIRONMENT,
    })


def configure_tracing(resource: Resource) -> TracerProvider:
    """Configure distributed tracing with OTLP exporter."""
    tracer_provider = TracerProvider(resource=resource)
    
    # Add OTLP exporter for production
    try:
        otlp_exporter = OTLPSpanExporter(endpoint=OTEL_EXPORTER_OTLP_ENDPOINT)
        tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    except Exception as e:
        print(f"Warning: Failed to configure OTLP trace exporter: {e}")
    
    # Add console exporter for development/debugging
    if OTEL_CONSOLE_EXPORT:
        console_exporter = ConsoleSpanExporter()
        tracer_provider.add_span_processor(BatchSpanProcessor(console_exporter))
    
    trace.set_tracer_provider(tracer_provider)
    return tracer_provider


def configure_metrics(resource: Resource) -> MeterProvider:
    """Configure metrics collection with OTLP exporter."""
    # Create metric readers
    readers = []
    
    # Add OTLP metric exporter for production
    try:
        otlp_metric_exporter = OTLPMetricExporter(endpoint=OTEL_EXPORTER_OTLP_ENDPOINT)
        otlp_reader = PeriodicExportingMetricReader(otlp_metric_exporter, export_interval_millis=60000)
        readers.append(otlp_reader)
    except Exception as e:
        print(f"Warning: Failed to configure OTLP metric exporter: {e}")
    
    # Add console exporter for development/debugging
    if OTEL_CONSOLE_EXPORT:
        console_metric_exporter = ConsoleMetricExporter()
        console_reader = PeriodicExportingMetricReader(console_metric_exporter, export_interval_millis=60000)
        readers.append(console_reader)
    
    meter_provider = MeterProvider(resource=resource, metric_readers=readers)
    metrics.set_meter_provider(meter_provider)
    return meter_provider


def configure_auto_instrumentation():
    """Configure automatic instrumentation for Django, database, and HTTP."""
    # Instrument Django
    DjangoInstrumentor().instrument()
    
    # Instrument database (PostgreSQL)
    Psycopg2Instrumentor().instrument()
    
    # Instrument outgoing HTTP requests
    RequestsInstrumentor().instrument()
    
    # Instrument Redis
    try:
        RedisInstrumentor().instrument()
    except Exception as e:
        print(f"Warning: Failed to instrument Redis: {e}")


def initialize_telemetry() -> tuple[TracerProvider, MeterProvider]:
    """
    Initialize OpenTelemetry with tracing, metrics, and auto-instrumentation.
    
    Returns:
        Tuple of (TracerProvider, MeterProvider)
    """
    # Create resource with service information
    resource = create_resource()
    
    # Configure tracing
    tracer_provider = configure_tracing(resource)
    
    # Configure metrics
    meter_provider = configure_metrics(resource)
    
    # Configure auto-instrumentation
    configure_auto_instrumentation()
    
    print(f"✅ OpenTelemetry initialized: {OTEL_SERVICE_NAME} v{OTEL_SERVICE_VERSION}")
    print(f"   Environment: {OTEL_ENVIRONMENT}")
    print(f"   OTLP Endpoint: {OTEL_EXPORTER_OTLP_ENDPOINT}")
    
    return tracer_provider, meter_provider


def get_tracer(name: str) -> trace.Tracer:
    """Get a tracer instance for creating custom spans."""
    return trace.get_tracer(name)


def get_meter(name: str) -> metrics.Meter:
    """Get a meter instance for creating custom metrics."""
    return metrics.get_meter(name)


# Create business metrics
_meter = get_meter("django.ecommerce.business")

# Cart metrics
cart_add_counter = _meter.create_counter(
    "cart.items.added",
    description="Number of items added to cart",
    unit="1",
)

cart_remove_counter = _meter.create_counter(
    "cart.items.removed",
    description="Number of items removed from cart",
    unit="1",
)

# Checkout metrics
checkout_started_counter = _meter.create_counter(
    "checkout.started",
    description="Number of checkout operations started",
    unit="1",
)

checkout_completed_counter = _meter.create_counter(
    "checkout.completed",
    description="Number of checkout operations completed successfully",
    unit="1",
)

checkout_failed_counter = _meter.create_counter(
    "checkout.failed",
    description="Number of checkout operations that failed",
    unit="1",
)

checkout_duration_histogram = _meter.create_histogram(
    "checkout.duration",
    description="Duration of checkout operations",
    unit="ms",
)

# Order metrics
order_created_counter = _meter.create_counter(
    "orders.created",
    description="Number of orders created",
    unit="1",
)

order_cancelled_counter = _meter.create_counter(
    "orders.cancelled",
    description="Number of orders cancelled",
    unit="1",
)

# Payment metrics
payment_success_counter = _meter.create_counter(
    "payments.success",
    description="Number of successful payments",
    unit="1",
)

payment_failed_counter = _meter.create_counter(
    "payments.failed",
    description="Number of failed payments",
    unit="1",
)

payment_duration_histogram = _meter.create_histogram(
    "payments.duration",
    description="Duration of payment operations",
    unit="ms",
)

# Error metrics
api_error_counter = _meter.create_counter(
    "api.errors",
    description="Number of API errors",
    unit="1",
)
