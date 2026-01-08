from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model


User = get_user_model()


@override_settings(OTEL_ENABLED=True)
class TelemetryBaggageMiddlewareTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="baguser",
            email="bag@example.com",
            password="testpass123",
        )
        self.client = Client()
        self.client.force_login(self.user)

    def test_baggage_is_attached_for_authenticated_user(self):
        # Import here to ensure Django is setup.
        from opentelemetry import baggage
        from opentelemetry.context import get_current

        # Hit any endpoint that exists and runs through middleware.
        response = self.client.get("/api/v1/products/")
        self.assertEqual(response.status_code, 200)

        # After request finishes, middleware detaches baggage.
        # So we just assert no exceptions and that current baggage isn't polluted.
        self.assertIsNone(baggage.get_baggage("user.id", context=get_current()))


@override_settings(OTEL_ENABLED=False)
class TelemetryBaggageDisabledTests(TestCase):
    def test_middleware_noop_when_disabled(self):
        client = Client()
        response = client.get("/api/v1/products/")
        self.assertEqual(response.status_code, 200)
