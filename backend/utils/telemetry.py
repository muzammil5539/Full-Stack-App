"""OpenTelemetry configuration for Django application.

This module sets up distributed tracing, metrics collection, and logging
with proper instrumentation for Django, database, cache, and HTTP requests.
"""

import os
import socket
from typing import Optional

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.sampling import ALWAYS_OFF, ALWAYS_ON, TraceIdRatioBased
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


_INITIALIZED = False
_TRACER_PROVIDER: Optional[TracerProvider] = None
_METER_PROVIDER: Optional[MeterProvider] = None


def _getenv(name: str, default: str) -> str:
    value = os.getenv(name)
    return default if value is None or value == "" else value


def _parse_resource_attributes(raw: str) -> dict:
    """Parse OTEL_RESOURCE_ATTRIBUTES style string: 'k1=v1,k2=v2'."""
    attributes: dict[str, str] = {}
    if not raw:
        return attributes
    for part in raw.split(','):
        part = part.strip()
        if not part or '=' not in part:
            continue
        key, value = part.split('=', 1)
        key = key.strip()
        value = value.strip()
        if key:
            attributes[key] = value
    return attributes


def _build_sampler():
    """Build a sampler from OTEL_TRACES_SAMPLER(_ARG) (subset)."""
    sampler_name = _getenv("OTEL_TRACES_SAMPLER", "always_on").lower()
    sampler_arg = os.getenv("OTEL_TRACES_SAMPLER_ARG")

    if sampler_name in {"always_on", "parentbased_always_on"}:
        return ALWAYS_ON
    if sampler_name in {"always_off", "parentbased_always_off"}:
        return ALWAYS_OFF
    if sampler_name in {"traceidratio", "traceidratio_based", "traceidratio-based"}:
        try:
            ratio = float(sampler_arg) if sampler_arg is not None else 1.0
        except ValueError:
            ratio = 1.0
        ratio = max(0.0, min(1.0, ratio))
        return TraceIdRatioBased(ratio)

    # Default to always_on if unknown.
    return ALWAYS_ON


# Configuration from environment variables
OTEL_SERVICE_NAME = _getenv('OTEL_SERVICE_NAME', 'django-ecommerce-backend')
OTEL_SERVICE_VERSION = _getenv('OTEL_SERVICE_VERSION', '1.0.0')
OTEL_EXPORTER_OTLP_ENDPOINT = _getenv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4317')
OTEL_ENVIRONMENT = _getenv('OTEL_ENVIRONMENT', 'development')
OTEL_SERVICE_NAMESPACE = os.getenv('OTEL_SERVICE_NAMESPACE')
OTEL_CONSOLE_EXPORT = _getenv('OTEL_CONSOLE_EXPORT', 'false').lower() == 'true'
OTEL_RESOURCE_ATTRIBUTES = os.getenv('OTEL_RESOURCE_ATTRIBUTES', '')
OTEL_METRICS_EXPORTER = _getenv('OTEL_METRICS_EXPORTER', 'otlp')
try:
    OTEL_METRICS_EXPORT_INTERVAL_MS = int(_getenv('OTEL_METRICS_EXPORT_INTERVAL_MS', '60000'))
except ValueError:
    OTEL_METRICS_EXPORT_INTERVAL_MS = 60000


def _parse_exporters(raw: str) -> set[str]:
    exporters = {p.strip().lower() for p in (raw or '').split(',') if p.strip()}
    if not exporters:
        return set()
    if 'none' in exporters:
        return set()
    if 'all' in exporters:
        return {'otlp', 'console'}
    return exporters


def create_resource() -> Resource:
    """Create resource with service attributes."""
    instance_id = (
        os.getenv("OTEL_SERVICE_INSTANCE_ID")
        or os.getenv("HOSTNAME")
        or os.getenv("COMPUTERNAME")
        or socket.gethostname()
    )

    base_attributes: dict[str, str] = {
        SERVICE_NAME: OTEL_SERVICE_NAME,
        SERVICE_VERSION: OTEL_SERVICE_VERSION,
        "environment": OTEL_ENVIRONMENT,
        "deployment.environment": OTEL_ENVIRONMENT,
        "service.instance.id": instance_id,
    }
    if OTEL_SERVICE_NAMESPACE:
        base_attributes["service.namespace"] = OTEL_SERVICE_NAMESPACE

    env_attributes = _parse_resource_attributes(OTEL_RESOURCE_ATTRIBUTES)
    base_attributes.update(env_attributes)

    return Resource.create(base_attributes)


def configure_tracing(resource: Resource) -> TracerProvider:
    """Configure distributed tracing with OTLP exporter."""
    current_provider = trace.get_tracer_provider()
    tracer_provider: TracerProvider

    if isinstance(current_provider, TracerProvider):
        tracer_provider = current_provider
    else:
        tracer_provider = TracerProvider(resource=resource, sampler=_build_sampler())
    
    # Avoid adding duplicate processors when called repeatedly.
    configured = getattr(tracer_provider, "_ecommerce_trace_configured", None)
    desired = (OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_CONSOLE_EXPORT)
    if configured != desired:
        # Add OTLP exporter
        try:
            otlp_exporter = OTLPSpanExporter(endpoint=OTEL_EXPORTER_OTLP_ENDPOINT)
            tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        except Exception as e:
            print(f"Warning: Failed to configure OTLP trace exporter: {e}")

        # Add console exporter for development/debugging
        if OTEL_CONSOLE_EXPORT:
            console_exporter = ConsoleSpanExporter()
            tracer_provider.add_span_processor(BatchSpanProcessor(console_exporter))

        setattr(tracer_provider, "_ecommerce_trace_configured", desired)

    if not isinstance(current_provider, TracerProvider):
        trace.set_tracer_provider(tracer_provider)
    return tracer_provider


def configure_metrics(resource: Resource) -> MeterProvider:
    """Configure metrics collection with OTLP exporter."""
    current_meter_provider = metrics.get_meter_provider()

    exporters = _parse_exporters(OTEL_METRICS_EXPORTER)

    # Create metric readers
    readers = []

    # Add OTLP metric exporter
    if 'otlp' in exporters or not exporters:
        try:
            otlp_metric_exporter = OTLPMetricExporter(endpoint=OTEL_EXPORTER_OTLP_ENDPOINT)
            otlp_reader = PeriodicExportingMetricReader(
                otlp_metric_exporter,
                export_interval_millis=OTEL_METRICS_EXPORT_INTERVAL_MS,
            )
            readers.append(otlp_reader)
        except Exception as e:
            print(f"Warning: Failed to configure OTLP metric exporter: {e}")

    # Add console exporter for development/debugging
    if OTEL_CONSOLE_EXPORT or 'console' in exporters:
        try:
            console_metric_exporter = ConsoleMetricExporter()
            console_reader = PeriodicExportingMetricReader(
                console_metric_exporter,
                export_interval_millis=OTEL_METRICS_EXPORT_INTERVAL_MS,
            )
            readers.append(console_reader)
        except Exception as e:
            print(f"Warning: Failed to configure console metric exporter: {e}")
    
    # If a MeterProvider is already set, we cannot replace it (set-once).
    if isinstance(current_meter_provider, MeterProvider):
        return current_meter_provider

    meter_provider = MeterProvider(resource=resource, metric_readers=readers)
    metrics.set_meter_provider(meter_provider)
    return meter_provider


def configure_auto_instrumentation():
    """Configure automatic instrumentation for Django, database, and HTTP."""
    # Instrument Django
    django_inst = DjangoInstrumentor()
    if not getattr(django_inst, 'is_instrumented_by_opentelemetry', False):
        django_inst.instrument()

    # Instrument database (PostgreSQL)
    psycopg2_inst = Psycopg2Instrumentor()
    if not getattr(psycopg2_inst, 'is_instrumented_by_opentelemetry', False):
        psycopg2_inst.instrument()

    # Instrument outgoing HTTP requests
    requests_inst = RequestsInstrumentor()
    if not getattr(requests_inst, 'is_instrumented_by_opentelemetry', False):
        requests_inst.instrument()
    
    # Instrument Redis
    try:
        redis_inst = RedisInstrumentor()
        if not getattr(redis_inst, 'is_instrumented_by_opentelemetry', False):
            redis_inst.instrument()
    except Exception as e:
        print(f"Warning: Failed to instrument Redis: {e}")


def initialize_telemetry() -> tuple[TracerProvider, MeterProvider]:
    """
    Initialize OpenTelemetry with tracing, metrics, and auto-instrumentation.
    
    Returns:
        Tuple of (TracerProvider, MeterProvider)
    """
    global _INITIALIZED, _TRACER_PROVIDER, _METER_PROVIDER
    if _INITIALIZED and _TRACER_PROVIDER and _METER_PROVIDER:
        return _TRACER_PROVIDER, _METER_PROVIDER

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
    
    _TRACER_PROVIDER = tracer_provider
    _METER_PROVIDER = meter_provider
    _INITIALIZED = True

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
payment_created_counter = _meter.create_counter(
    "payments.created",
    description="Number of payments created",
    unit="1",
)

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

# Admin/backend metrics
admin_request_counter = _meter.create_counter(
    "admin.requests",
    description="Number of admin API requests",
    unit="1",
)

admin_error_counter = _meter.create_counter(
    "admin.errors",
    description="Number of admin API errors",
    unit="1",
)

admin_duration_histogram = _meter.create_histogram(
    "admin.request.duration",
    description="Duration of admin API requests",
    unit="ms",
)
