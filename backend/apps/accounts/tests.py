from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AddressOwnershipTests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user1 = User.objects.create_user(
			username='user1',
			email='user1@example.com',
			password='pass12345',
		)
		self.user2 = User.objects.create_user(
			username='user2',
			email='user2@example.com',
			password='pass12345',
		)

	def test_create_address_ignores_user_field(self):
		self.client.force_authenticate(user=self.user1)

		url = reverse('address-list')
		payload = {
			'user': self.user2.id,
			'address_type': 'shipping',
			'full_name': 'Test User',
			'phone': '1234567890',
			'address_line1': '123 Main St',
			'address_line2': '',
			'city': 'Test City',
			'state': 'Test State',
			'postal_code': '12345',
			'country': 'Test Country',
			'is_default': False,
		}

		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
		self.assertEqual(resp.data['user'], self.user1.id)

		created_id = resp.data['id']

		self.client.force_authenticate(user=self.user2)
		detail_url = reverse('address-detail', args=[created_id])
		resp2 = self.client.get(detail_url)
		self.assertEqual(resp2.status_code, status.HTTP_404_NOT_FOUND)


class UserProfileOwnershipTests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user1 = User.objects.create_user(
			username='puser1',
			email='puser1@example.com',
			password='pass12345',
		)
		self.user2 = User.objects.create_user(
			username='puser2',
			email='puser2@example.com',
			password='pass12345',
		)

	def test_create_profile_ignores_user_field(self):
		self.client.force_authenticate(user=self.user1)

		url = reverse('profile-list')
		payload = {
			'user': self.user2.id,
			'bio': 'Hello',
		}

		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
		self.assertEqual(resp.data['user'], self.user1.id)

		created_id = resp.data['id']

		self.client.force_authenticate(user=self.user2)
		detail_url = reverse('profile-detail', args=[created_id])
		resp2 = self.client.get(detail_url)
		self.assertEqual(resp2.status_code, status.HTTP_404_NOT_FOUND)

