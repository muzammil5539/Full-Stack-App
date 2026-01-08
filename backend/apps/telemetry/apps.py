"""
Configuration for telemetry app.
Initializes OpenTelemetry on Django startup.
"""
from django.apps import AppConfig
from django.conf import settings


class TelemetryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.telemetry'
    verbose_name = 'OpenTelemetry Telemetry'
    
    def ready(self):
        """Initialize OpenTelemetry when Django starts."""
        if getattr(settings, 'OTEL_ENABLED', True):
            from utils.telemetry import initialize_telemetry
            initialize_telemetry()
