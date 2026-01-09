"""
Configuration for telemetry app.
Initializes OpenTelemetry on Django startup.
"""
from django.apps import AppConfig
from django.conf import settings
import os
import socket
from urllib.parse import urlparse


class TelemetryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.telemetry'
    verbose_name = 'OpenTelemetry Telemetry'
    
    def ready(self):
        """Initialize OpenTelemetry when Django starts."""
        if getattr(settings, 'OTEL_ENABLED', True):
            # Check that the configured OTLP endpoint is reachable before initializing
            try:
                from utils.telemetry import initialize_telemetry, OTEL_EXPORTER_OTLP_ENDPOINT
                endpoint = OTEL_EXPORTER_OTLP_ENDPOINT or os.getenv('OTEL_EXPORTER_OTLP_ENDPOINT', '')
                parsed = urlparse(endpoint)
                host = parsed.hostname or 'localhost'
                port = parsed.port or (4317)

                try:
                    # quick TCP connect test with short timeout
                    sock = socket.create_connection((host, port), timeout=1)
                    sock.close()
                except Exception:
                    print(f"⚠️ OpenTelemetry OTLP endpoint {host}:{port} unreachable — skipping telemetry initialization.")
                    return

                initialize_telemetry()
            except Exception as e:
                # Avoid blowing up app startup for telemetry issues; log and continue.
                print(f"Warning: telemetry initialization failed: {e}")
