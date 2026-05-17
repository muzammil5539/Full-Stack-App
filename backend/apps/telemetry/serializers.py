from rest_framework import serializers
from .models import TelemetryTrace, TelemetrySpan


class TelemetrySpanSerializer(serializers.ModelSerializer):
    """Serializer for telemetry spans."""
    
    class Meta:
        model = TelemetrySpan
        fields = [
            'id',
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
        read_only_fields = ['id', 'created_at', 'updated_at']


class TelemetryTraceSerializer(serializers.ModelSerializer):
    """Serializer for telemetry traces."""
    
    spans = TelemetrySpanSerializer(many=True, read_only=True)
    span_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TelemetryTrace
        fields = [
            'id',
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
            'spans',
            'span_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_span_count(self, obj):
        """Get the number of spans in this trace."""
        return obj.spans.count()


class TelemetryTraceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for telemetry trace lists (without spans)."""
    
    span_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TelemetryTrace
        fields = [
            'id',
            'trace_id',
            'username',
            'email',
            'service_name',
            'environment',
            'root_span_name',
            'status',
            'duration_ms',
            'http_method',
            'http_url',
            'http_status_code',
            'span_count',
            'created_at',
        ]
        read_only_fields = fields
    
    def get_span_count(self, obj):
        """Get the number of spans in this trace."""
        return obj.spans.count()
