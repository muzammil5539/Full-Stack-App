from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.products.models import Category, Product
from apps.orders.models import Order


class CreateFromCartPricingValidationTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.user = User.objects.create_user(
			email='test@example.com',
			username='testuser',
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
			sku='SKU-1',
			price=Decimal('10.00'),
			stock=10,
			is_active=True,
		)

		self.cart = Cart.objects.create(user=self.user)
		self.item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=1)

	def test_negative_shipping_cost_rejected(self):
		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{'item_ids': [self.item.id], 'shipping_cost': '-1.00'},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_discount_exceeds_total_rejected(self):
		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{'item_ids': [self.item.id], 'discount': '999.00'},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_valid_pricing_creates_order(self):
		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 201)
		self.assertEqual(Order.objects.count(), 1)
		self.assertFalse(self.cart.items.filter(id=self.item.id).exists())
