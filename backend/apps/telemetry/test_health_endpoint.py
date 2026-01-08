from django.test import TestCase
from rest_framework.test import APIClient


class TelemetryHealthEndpointTests(TestCase):
    def test_health_endpoint_returns_status(self):
        client = APIClient()
        response = client.get('/api/v1/telemetry/health/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('otel_enabled', response.data)
        self.assertIn('tracing_provider', response.data)
        self.assertIn('metrics_provider', response.data)
        self.assertIn('sdk', response.data)
        self.assertIn('tracing', response.data['sdk'])
        self.assertIn('metrics', response.data['sdk'])
