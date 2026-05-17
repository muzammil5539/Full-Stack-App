from __future__ import annotations

from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider

from .models import TelemetryTrace, TelemetrySpan
from .serializers import TelemetryTraceSerializer, TelemetryTraceListSerializer, TelemetrySpanSerializer
from utils.permissions import IsStaffOrInAdminGroupStrict


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


class TelemetryTraceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only read access to telemetry traces.
    Provides list and detail views of captured traces with user context.
    """
    queryset = TelemetryTrace.objects.all().select_related('user').prefetch_related('spans')
    permission_classes = [IsStaffOrInAdminGroupStrict]
    filterset_fields = ['status', 'environment', 'username', 'user']
    search_fields = ['trace_id', 'username', 'email', 'root_span_name', 'http_url']
    ordering_fields = ['created_at', 'duration_ms', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use lighter serializer for list view."""
        if self.action == 'list':
            return TelemetryTraceListSerializer
        return TelemetryTraceSerializer


class TelemetrySpanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only read access to telemetry spans.
    Provides list and detail views of captured spans.
    """
    queryset = TelemetrySpan.objects.all().select_related('trace')
    serializer_class = TelemetrySpanSerializer
    permission_classes = [IsStaffOrInAdminGroupStrict]
    filterset_fields = ['trace', 'status', 'kind', 'name']
    search_fields = ['span_id', 'name', 'status_message']
    ordering_fields = ['start_time', 'duration_ms', 'status']
    ordering = ['start_time']
