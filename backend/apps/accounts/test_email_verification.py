from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.accounts.models import User, EmailVerificationToken


class EmailVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            is_verified=False,
        )

    def test_registration_creates_verification_token(self):
        """Test that registration creates a verification token"""
        response = self.client.post('/api/v1/accounts/register/', {
            'email': 'newuser@example.com',
            'password': 'password123',
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('verification_token', response.data)
        self.assertIn('message', response.data)
        
        # Check that token was created in database
        user = User.objects.get(email='newuser@example.com')
        self.assertFalse(user.is_verified)
        self.assertTrue(EmailVerificationToken.objects.filter(user=user, is_used=False).exists())

    def test_verify_email_with_valid_token(self):
        """Test email verification with valid token"""
        token = EmailVerificationToken.create_token(self.user)
        
        response = self.client.post('/api/v1/accounts/users/verify_email/', {
            'token': token.token,
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Email verified successfully.')
        
        # Check user is now verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        
        # Check token is marked as used
        token.refresh_from_db()
        self.assertTrue(token.is_used)

    def test_verify_email_with_invalid_token(self):
        """Test email verification with invalid token"""
        response = self.client.post('/api/v1/accounts/users/verify_email/', {
            'token': 'invalid-token-123',
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_verify_email_with_expired_token(self):
        """Test email verification with expired token"""
        token = EmailVerificationToken.objects.create(
            user=self.user,
            token='expired-token',
            expires_at=timezone.now() - timedelta(hours=1),  # Expired 1 hour ago
        )
        
        response = self.client.post('/api/v1/accounts/users/verify_email/', {
            'token': token.token,
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertIn('expired', response.data['error'].lower())

    def test_verify_email_with_used_token(self):
        """Test email verification with already used token"""
        token = EmailVerificationToken.create_token(self.user)
        token.is_used = True
        token.save()
        
        response = self.client.post('/api/v1/accounts/users/verify_email/', {
            'token': token.token,
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_verify_email_without_token(self):
        """Test email verification without providing token"""
        response = self.client.post('/api/v1/accounts/users/verify_email/', {})
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_send_verification_email_authenticated(self):
        """Test sending verification email for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/v1/accounts/users/send_verification_email/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('verification_token', response.data)
        
        # Check that a new token was created
        self.assertTrue(EmailVerificationToken.objects.filter(user=self.user, is_used=False).exists())

    def test_send_verification_email_already_verified(self):
        """Test sending verification email for already verified user"""
        self.user.is_verified = True
        self.user.save()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/accounts/users/send_verification_email/')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('already verified', response.data['message'].lower())

    def test_send_verification_email_invalidates_old_tokens(self):
        """Test that sending new verification email invalidates old tokens"""
        # Create an old token
        old_token = EmailVerificationToken.create_token(self.user)
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/accounts/users/send_verification_email/')
        
        self.assertEqual(response.status_code, 200)
        
        # Check old token is marked as used
        old_token.refresh_from_db()
        self.assertTrue(old_token.is_used)
        
        # Check new token exists
        new_tokens = EmailVerificationToken.objects.filter(user=self.user, is_used=False)
        self.assertEqual(new_tokens.count(), 1)
        self.assertNotEqual(new_tokens.first().token, old_token.token)

    def test_token_is_valid_method(self):
        """Test the is_valid method on EmailVerificationToken"""
        # Valid token
        valid_token = EmailVerificationToken.create_token(self.user)
        self.assertTrue(valid_token.is_valid())
        
        # Used token
        used_token = EmailVerificationToken.create_token(self.user)
        used_token.is_used = True
        used_token.save()
        self.assertFalse(used_token.is_valid())
        
        # Expired token
        expired_token = EmailVerificationToken.objects.create(
            user=self.user,
            token='expired',
            expires_at=timezone.now() - timedelta(hours=1),
        )
        self.assertFalse(expired_token.is_valid())
