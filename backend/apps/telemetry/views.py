from __future__ import annotations

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider


@api_view(["GET"])
@permission_classes([AllowAny])
def telemetry_health(request):
    """Lightweight health endpoint for telemetry status.

    This does not attempt to contact any collector/exporter. It reports local
    configuration and whether SDK providers are installed.
    """
    tracer_provider = trace.get_tracer_provider()
    meter_provider = metrics.get_meter_provider()

    return Response(
        {
            "otel_enabled": bool(getattr(settings, "OTEL_ENABLED", True)),
            "tracing_provider": tracer_provider.__class__.__name__,
            "metrics_provider": meter_provider.__class__.__name__,
            "sdk": {
                "tracing": isinstance(tracer_provider, TracerProvider),
                "metrics": isinstance(meter_provider, MeterProvider),
            },
        }
    )
