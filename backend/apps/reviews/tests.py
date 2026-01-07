from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Brand, Category, Product
from apps.reviews.models import Review


class ReviewSecurityAndModerationTests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user1 = User.objects.create_user(
			username='ruser1',
			email='ruser1@example.com',
			password='pass12345',
		)
		self.user2 = User.objects.create_user(
			username='ruser2',
			email='ruser2@example.com',
			password='pass12345',
		)
		self.admin = User.objects.create_user(
			username='radmin',
			email='radmin@example.com',
			password='pass12345',
			is_staff=True,
		)

		self.category = Category.objects.create(name='Cat', slug='cat')
		self.brand = Brand.objects.create(name='Brand', slug='brand')
		self.product = Product.objects.create(
			name='Product',
			slug='product',
			description='Desc',
			short_description='Short',
			category=self.category,
			brand=self.brand,
			sku='SKU-1',
			price=Decimal('10.00'),
			stock=10,
		)

	def test_other_user_cannot_delete_unapproved_review(self):
		self.client.force_authenticate(user=self.user1)
		create_url = reverse('review-list')
		resp = self.client.post(
			create_url,
			{
				'product': self.product.id,
				'rating': 5,
				'title': 'Great',
				'comment': 'Nice',
			},
			format='json',
		)
		self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

		review_id = resp.data['id']

		self.client.force_authenticate(user=self.user2)
		delete_url = reverse('review-detail', args=[review_id])
		resp2 = self.client.delete(delete_url)

		# Either 404 (not in queryset) or 403 (permission) is acceptable security behavior.
		self.assertIn(resp2.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

		self.client.force_authenticate(user=self.user1)
		resp3 = self.client.delete(delete_url)
		self.assertEqual(resp3.status_code, status.HTTP_204_NO_CONTENT)

	def test_admin_can_approve_review_and_then_it_is_public(self):
		review = Review.objects.create(
			product=self.product,
			user=self.user1,
			rating=4,
			title='Ok',
			comment='Fine',
			is_approved=False,
		)

		self.client.force_authenticate(user=self.admin)
		approve_url = reverse('review-approve', args=[review.id])
		resp = self.client.post(approve_url, {}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)

		review.refresh_from_db()
		self.assertTrue(review.is_approved)

		self.client.force_authenticate(user=None)
		list_url = reverse('review-list')
		resp2 = self.client.get(list_url, {'product': self.product.id})
		self.assertEqual(resp2.status_code, status.HTTP_200_OK)
		results = resp2.data.get('results', resp2.data)
		self.assertTrue(any(r['id'] == review.id for r in results))

