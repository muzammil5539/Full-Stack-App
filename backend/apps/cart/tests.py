from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from unittest import mock

from apps.cart.models import Cart, CartItem
from apps.products.models import Category, Product


class CartQuantityEndpointsTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.user = User.objects.create_user(
			email='cart@example.com',
			username='cartuser',
			password='password123',
		)
		self.client.force_authenticate(user=self.user)

		self.category = Category.objects.create(
			name='Cat',
			slug='cat',
			description='',
			is_active=True,
		)
		self.product = Product.objects.create(
			name='Product',
			slug='product',
			description='desc',
			category=self.category,
			brand=None,
			sku='SKU-CART-1',
			price=Decimal('10.00'),
			stock=10,
			is_active=True,
		)

		self.cart = Cart.objects.create(user=self.user)
		self.item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

	def test_increment_item(self):
		res = self.client.post('/api/v1/cart/increment_item/', {'item_id': self.item.id}, format='json')
		self.assertEqual(res.status_code, 200)
		self.item.refresh_from_db()
		self.assertEqual(self.item.quantity, 3)

	def test_decrement_item(self):
		res = self.client.post('/api/v1/cart/decrement_item/', {'item_id': self.item.id}, format='json')
		self.assertEqual(res.status_code, 200)
		self.item.refresh_from_db()
		self.assertEqual(self.item.quantity, 1)

	def test_decrement_item_deletes_at_zero(self):
		self.item.quantity = 1
		self.item.save()
		res = self.client.post('/api/v1/cart/decrement_item/', {'item_id': self.item.id}, format='json')
		self.assertEqual(res.status_code, 200)
		self.assertFalse(CartItem.objects.filter(id=self.item.id).exists())

	def test_set_quantity_sets_value(self):
		res = self.client.post(
			'/api/v1/cart/set_quantity/',
			{'item_id': self.item.id, 'quantity': 5},
			format='json',
		)
		self.assertEqual(res.status_code, 200)
		self.item.refresh_from_db()
		self.assertEqual(self.item.quantity, 5)

	def test_set_quantity_zero_deletes(self):
		res = self.client.post(
			'/api/v1/cart/set_quantity/',
			{'item_id': self.item.id, 'quantity': 0},
			format='json',
		)
		self.assertEqual(res.status_code, 200)
		self.assertFalse(CartItem.objects.filter(id=self.item.id).exists())

	def test_clear_creates_cart_if_missing(self):
		Cart.objects.filter(user=self.user).delete()
		res = self.client.post('/api/v1/cart/clear/', {}, format='json')
		self.assertEqual(res.status_code, 200)
		self.assertTrue(Cart.objects.filter(user=self.user).exists())


class CartBusinessMetricsTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.user = User.objects.create_user(
			email='cart-metrics@example.com',
			username='cartmetrics',
			password='password123',
		)
		self.client.force_authenticate(user=self.user)

		self.category = Category.objects.create(
			name='Cat',
			slug='cat-metrics',
			description='',
			is_active=True,
		)
		self.product = Product.objects.create(
			name='Product',
			slug='product-metrics',
			description='desc',
			category=self.category,
			brand=None,
			sku='SKU-CART-METRICS-1',
			price=Decimal('10.00'),
			stock=10,
			is_active=True,
		)

	@mock.patch('apps.cart.views.cart_add_counter')
	def test_add_item_records_metric(self, mock_counter):
		res = self.client.post(
			'/api/v1/cart/add_item/',
			{'product': self.product.id, 'quantity': 2},
			format='json',
		)
		self.assertEqual(res.status_code, 200)
		mock_counter.add.assert_called()

	@mock.patch('apps.cart.views.record_span_error')
	def test_remove_item_not_found_records_span_error(self, mock_record_error):
		res = self.client.post(
			'/api/v1/cart/remove_item/',
			{'item_id': 999999},
			format='json',
		)
		self.assertEqual(res.status_code, 404)
		mock_record_error.assert_called_once()
