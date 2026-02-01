from __future__ import annotations

from django.conf import settings
from opentelemetry import baggage
from opentelemetry.context import attach, detach, get_current
from utils.telemetry_capture import capture_current_trace


class TelemetryBaggageMiddleware:
    """Attach useful baggage for correlation across services.

    Adds:
    - user.id (if authenticated)
    - session.key (if available)
    
    Also captures trace information in database for admin portal viewing.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, "OTEL_ENABLED", True):
            return self.get_response(request)

        values: dict[str, str] = {}

        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            values["user.id"] = str(getattr(user, "id", ""))

        session = getattr(request, "session", None)
        if session is not None:
            session_key = getattr(session, "session_key", None)
            if session_key:
                values["session.key"] = str(session_key)

        if not values:
            response = self.get_response(request)
            # Still try to capture trace even without baggage
            try:
                capture_current_trace(request)
            except Exception:
                pass
            return response

        ctx = get_current()
        for k, v in values.items():
            ctx = baggage.set_baggage(k, v, context=ctx)

        token = attach(ctx)
        try:
            response = self.get_response(request)
            # Capture trace information in database
            try:
                capture_current_trace(request)
            except Exception:
                # Never break request processing
                pass
            return response
        finally:
            detach(token)
