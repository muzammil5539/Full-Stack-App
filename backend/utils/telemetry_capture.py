"""Utility to capture and store OpenTelemetry traces in the database.

This module provides functions to extract trace/span information from
OpenTelemetry context and store it in Django models for admin portal viewing.
"""

from __future__ import annotations

import datetime
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from opentelemetry import trace
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.trace import Status, StatusCode

from apps.telemetry.models import TelemetryTrace, TelemetrySpan

User = get_user_model()


def _status_code_to_string(status_code: StatusCode) -> str:
    """Convert OpenTelemetry StatusCode to string."""
    if status_code == StatusCode.OK:
        return 'ok'
    elif status_code == StatusCode.ERROR:
        return 'error'
    else:
        return 'unset'


def _span_kind_to_string(kind) -> str:
    """Convert span kind to string."""
    from opentelemetry.trace import SpanKind
    
    if kind == SpanKind.INTERNAL:
        return 'internal'
    elif kind == SpanKind.SERVER:
        return 'server'
    elif kind == SpanKind.CLIENT:
        return 'client'
    elif kind == SpanKind.PRODUCER:
        return 'producer'
    elif kind == SpanKind.CONSUMER:
        return 'consumer'
    else:
        return 'internal'


def _timestamp_to_datetime(timestamp_ns: int) -> datetime.datetime:
    """Convert nanosecond timestamp to datetime."""
    from django.utils import timezone
    return timezone.make_aware(
        datetime.datetime.fromtimestamp(timestamp_ns / 1e9),
        timezone.get_current_timezone()
    )


def _extract_http_attributes(span: ReadableSpan) -> dict:
    """Extract HTTP-related attributes from span."""
    attrs = span.attributes or {}
    return {
        'method': attrs.get('http.method', ''),
        'url': attrs.get('http.url', '') or attrs.get('http.target', ''),
        'status_code': attrs.get('http.status_code'),
        'user_agent': attrs.get('http.user_agent', ''),
    }


def store_span_in_db(span: ReadableSpan, request=None) -> Optional[TelemetrySpan]:
    """
    Store a completed span in the database.
    
    Args:
        span: The OpenTelemetry span to store
        request: Optional Django request object for user context
    
    Returns:
        The created TelemetrySpan instance, or None if storage fails
    """
    if not getattr(settings, 'OTEL_ENABLED', True):
        return None
    
    try:
        # Extract trace and span IDs
        span_context = span.get_span_context()
        trace_id = format(span_context.trace_id, '032x')
        span_id = format(span_context.span_id, '016x')
        
        # Get or create trace record
        trace_record, trace_created = TelemetryTrace.objects.get_or_create(
            trace_id=trace_id,
            defaults=_get_trace_defaults(span, request)
        )
        
        # Update trace with span information if this is the root span
        if trace_created or not trace_record.root_span_name:
            _update_trace_with_span(trace_record, span, request)
        
        # Extract parent span ID if present
        parent_span_id = ''
        if span.parent and span.parent.span_id:
            parent_span_id = format(span.parent.span_id, '016x')
        
        # Calculate duration
        duration_ms = None
        start_time = None
        end_time = None
        
        if span.start_time:
            start_time = _timestamp_to_datetime(span.start_time)
        if span.end_time:
            end_time = _timestamp_to_datetime(span.end_time)
        if span.start_time and span.end_time:
            duration_ms = (span.end_time - span.start_time) / 1e6
        
        # Extract attributes and events
        attributes = dict(span.attributes) if span.attributes else {}
        events = []
        if span.events:
            for event in span.events:
                events.append({
                    'name': event.name,
                    'timestamp': event.timestamp,
                    'attributes': dict(event.attributes) if event.attributes else {}
                })
        
        # Create span record
        span_record = TelemetrySpan.objects.create(
            trace=trace_record,
            span_id=span_id,
            parent_span_id=parent_span_id,
            name=span.name,
            kind=_span_kind_to_string(span.kind),
            start_time=start_time,
            end_time=end_time,
            duration_ms=duration_ms,
            status=_status_code_to_string(span.status.status_code) if span.status else 'unset',
            status_message=span.status.description if span.status and span.status.description else '',
            attributes=attributes,
            events=events,
        )
        
        # Update trace duration if this span completes it
        if duration_ms and (not trace_record.duration_ms or duration_ms > trace_record.duration_ms):
            trace_record.duration_ms = duration_ms
            trace_record.save(update_fields=['duration_ms'])
        
        return span_record
        
    except Exception as e:
        # Never break application because of telemetry storage
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to store span in database: {e}")
        return None


def _get_trace_defaults(span: ReadableSpan, request=None) -> dict:
    """Get default values for creating a trace record."""
    defaults = {
        'service_name': getattr(settings, 'OTEL_SERVICE_NAME', 'django-ecommerce-backend'),
        'environment': getattr(settings, 'OTEL_ENVIRONMENT', 'development'),
        'root_span_name': span.name,
    }
    
    # Add user information if available
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        defaults['user'] = request.user
        defaults['username'] = request.user.username
        defaults['email'] = getattr(request.user, 'email', '')
        defaults['phone'] = getattr(request.user, 'phone', '')
    
    # Extract HTTP attributes
    http_attrs = _extract_http_attributes(span)
    defaults['http_method'] = http_attrs['method']
    defaults['http_url'] = http_attrs['url']
    defaults['http_status_code'] = http_attrs['status_code']
    defaults['user_agent'] = http_attrs['user_agent']
    
    # Set initial status
    if span.status:
        defaults['status'] = _status_code_to_string(span.status.status_code)
    
    return defaults


def _update_trace_with_span(trace_record: TelemetryTrace, span: ReadableSpan, request=None) -> None:
    """Update trace record with information from a span."""
    try:
        # Update user info if not already set
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if not trace_record.user:
                trace_record.user = request.user
                trace_record.username = request.user.username
                trace_record.email = getattr(request.user, 'email', '')
                trace_record.phone = getattr(request.user, 'phone', '')
        
        # Update HTTP attributes if available
        http_attrs = _extract_http_attributes(span)
        if http_attrs['method'] and not trace_record.http_method:
            trace_record.http_method = http_attrs['method']
        if http_attrs['url'] and not trace_record.http_url:
            trace_record.http_url = http_attrs['url']
        if http_attrs['status_code'] and not trace_record.http_status_code:
            trace_record.http_status_code = http_attrs['status_code']
        if http_attrs['user_agent'] and not trace_record.user_agent:
            trace_record.user_agent = http_attrs['user_agent']
        
        # Update status if error
        if span.status and span.status.status_code == StatusCode.ERROR:
            trace_record.status = 'error'
        
        trace_record.save()
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to update trace record: {e}")


def capture_current_trace(request=None) -> Optional[TelemetryTrace]:
    """
    Capture the current trace context and store it in the database.
    
    This is a convenience function to store trace information for the current context.
    
    Args:
        request: Optional Django request object for user context
    
    Returns:
        The TelemetryTrace instance, or None if no active trace
    """
    if not getattr(settings, 'OTEL_ENABLED', True):
        return None
    
    try:
        current_span = trace.get_current_span()
        if not current_span or not current_span.is_recording():
            return None
        
        span_context = current_span.get_span_context()
        if not span_context.is_valid:
            return None
        
        trace_id = format(span_context.trace_id, '032x')
        
        # Check if trace already exists
        try:
            return TelemetryTrace.objects.get(trace_id=trace_id)
        except TelemetryTrace.DoesNotExist:
            # Create new trace record
            defaults = {
                'service_name': getattr(settings, 'OTEL_SERVICE_NAME', 'django-ecommerce-backend'),
                'environment': getattr(settings, 'OTEL_ENVIRONMENT', 'development'),
                'root_span_name': current_span.name if hasattr(current_span, 'name') else '',
            }
            
            # Add user information if available
            if request and hasattr(request, 'user') and request.user.is_authenticated:
                defaults['user'] = request.user
                defaults['username'] = request.user.username
                defaults['email'] = getattr(request.user, 'email', '')
                defaults['phone'] = getattr(request.user, 'phone', '')
            
            return TelemetryTrace.objects.create(trace_id=trace_id, **defaults)
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to capture current trace: {e}")
        return None
