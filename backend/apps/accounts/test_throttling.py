from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.accounts.models import User
from apps.accounts.views import RegisterView, AuthRateThrottle
from apps.accounts.urls import ThrottledObtainAuthToken


class AuthThrottlingTests(TestCase):
    def test_register_has_throttle_class(self):
        """Test that RegisterView has throttling configured"""
        self.assertIn(AuthRateThrottle, RegisterView.throttle_classes)

    def test_auth_rate_throttle_scope(self):
        """Test that AuthRateThrottle has correct scope"""
        throttle = AuthRateThrottle()
        self.assertEqual(throttle.scope, 'auth')

    def test_token_view_has_throttle_class(self):
        """Test that token view has throttling configured"""
        self.assertIn(AuthRateThrottle, ThrottledObtainAuthToken.throttle_classes)
