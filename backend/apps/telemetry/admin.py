from django.contrib import admin
from .models import TelemetryTrace, TelemetrySpan


@admin.register(TelemetryTrace)
class TelemetryTraceAdmin(admin.ModelAdmin):
    """Admin interface for telemetry traces."""
    
    list_display = [
        'trace_id_short',
        'username',
        'email',
        'service_name',
        'environment',
        'status',
        'duration_ms',
        'created_at',
    ]
    list_filter = ['status', 'environment', 'service_name', 'created_at']
    search_fields = ['trace_id', 'username', 'email', 'http_url', 'root_span_name']
    readonly_fields = [
        'trace_id',
        'user',
        'username',
        'email',
        'phone',
        'service_name',
        'environment',
        'root_span_name',
        'status',
        'duration_ms',
        'http_method',
        'http_url',
        'http_status_code',
        'user_agent',
        'created_at',
        'updated_at',
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def trace_id_short(self, obj):
        """Display shortened trace ID."""
        return f"{obj.trace_id[:16]}..."
    trace_id_short.short_description = 'Trace ID'


@admin.register(TelemetrySpan)
class TelemetrySpanAdmin(admin.ModelAdmin):
    """Admin interface for telemetry spans."""
    
    list_display = [
        'span_id_short',
        'trace_id_short',
        'name',
        'kind',
        'status',
        'duration_ms',
        'start_time',
    ]
    list_filter = ['status', 'kind', 'start_time']
    search_fields = ['span_id', 'name', 'status_message', 'trace__trace_id']
    readonly_fields = [
        'trace',
        'span_id',
        'parent_span_id',
        'name',
        'kind',
        'start_time',
        'end_time',
        'duration_ms',
        'status',
        'status_message',
        'attributes',
        'events',
        'created_at',
        'updated_at',
    ]
    date_hierarchy = 'start_time'
    ordering = ['trace', 'start_time']
    
    def span_id_short(self, obj):
        """Display shortened span ID."""
        return f"{obj.span_id[:8]}..."
    span_id_short.short_description = 'Span ID'
    
    def trace_id_short(self, obj):
        """Display shortened trace ID."""
        return f"{obj.trace.trace_id[:16]}..."
    trace_id_short.short_description = 'Trace ID'
