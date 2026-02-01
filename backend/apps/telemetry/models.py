from django.db import models
from django.conf import settings
from utils.models import TimeStampedModel


class TelemetryTrace(TimeStampedModel):
    """Store OpenTelemetry trace information with user context."""
    
    trace_id = models.CharField(max_length=32, unique=True, db_index=True, help_text="Unique trace ID (hex)")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='telemetry_traces',
        help_text="User who initiated the trace"
    )
    username = models.CharField(max_length=150, blank=True, help_text="Username at time of trace")
    email = models.EmailField(blank=True, help_text="User email at time of trace")
    phone = models.CharField(max_length=20, blank=True, help_text="User phone at time of trace")
    
    service_name = models.CharField(max_length=255, blank=True, help_text="Service that generated the trace")
    environment = models.CharField(max_length=50, blank=True, help_text="Environment (dev/prod/staging)")
    
    # Trace metadata
    root_span_name = models.CharField(max_length=255, blank=True, help_text="Name of the root span")
    status = models.CharField(
        max_length=20,
        choices=[
            ('ok', 'OK'),
            ('error', 'Error'),
            ('unset', 'Unset'),
        ],
        default='unset',
        help_text="Overall trace status"
    )
    duration_ms = models.FloatField(null=True, blank=True, help_text="Total trace duration in milliseconds")
    
    # Additional context
    http_method = models.CharField(max_length=10, blank=True)
    http_url = models.TextField(blank=True)
    http_status_code = models.IntegerField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        app_label = 'telemetry'
        db_table = 'telemetry_traces'
        verbose_name = 'Telemetry Trace'
        verbose_name_plural = 'Telemetry Traces'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Trace {self.trace_id[:8]}... - {self.username or 'Anonymous'}"


class TelemetrySpan(TimeStampedModel):
    """Store OpenTelemetry span information."""
    
    trace = models.ForeignKey(
        TelemetryTrace,
        on_delete=models.CASCADE,
        related_name='spans',
        help_text="Parent trace"
    )
    span_id = models.CharField(max_length=16, db_index=True, help_text="Unique span ID (hex)")
    parent_span_id = models.CharField(max_length=16, blank=True, help_text="Parent span ID (hex)")
    
    # Span details
    name = models.CharField(max_length=255, help_text="Span operation name")
    kind = models.CharField(
        max_length=20,
        choices=[
            ('internal', 'Internal'),
            ('server', 'Server'),
            ('client', 'Client'),
            ('producer', 'Producer'),
            ('consumer', 'Consumer'),
        ],
        default='internal',
        help_text="Span kind"
    )
    
    # Timing
    start_time = models.DateTimeField(help_text="Span start time")
    end_time = models.DateTimeField(null=True, blank=True, help_text="Span end time")
    duration_ms = models.FloatField(null=True, blank=True, help_text="Span duration in milliseconds")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('ok', 'OK'),
            ('error', 'Error'),
            ('unset', 'Unset'),
        ],
        default='unset',
        help_text="Span status"
    )
    status_message = models.TextField(blank=True, help_text="Status description or error message")
    
    # Attributes (stored as JSON)
    attributes = models.JSONField(default=dict, blank=True, help_text="Span attributes")
    events = models.JSONField(default=list, blank=True, help_text="Span events")
    
    class Meta:
        app_label = 'telemetry'
        db_table = 'telemetry_spans'
        verbose_name = 'Telemetry Span'
        verbose_name_plural = 'Telemetry Spans'
        ordering = ['trace', 'start_time']
        indexes = [
            models.Index(fields=['trace', 'start_time']),
            models.Index(fields=['name']),
            models.Index(fields=['status']),
        ]
        unique_together = [['trace', 'span_id']]
    
    def __str__(self):
        return f"Span {self.span_id[:8]}... - {self.name}"
