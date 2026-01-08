from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User


class PasswordChangeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123',
        )
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        """Test successful password change"""
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword456',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

    def test_change_password_wrong_old_password(self):
        """Test password change with incorrect old password"""
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword456',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('old_password', response.data)

    def test_change_password_missing_old_password(self):
        """Test password change without old password"""
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'new_password': 'newpassword456',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('old_password', response.data)

    def test_change_password_missing_new_password(self):
        """Test password change without new password"""
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'old_password': 'oldpassword123',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('new_password', response.data)

    def test_change_password_too_short(self):
        """Test password change with new password too short"""
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'old_password': 'oldpassword123',
            'new_password': 'short',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('new_password', response.data)

    def test_change_password_requires_authentication(self):
        """Test that password change requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/v1/accounts/users/change_password/', {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword456',
        })
        self.assertEqual(response.status_code, 401)
