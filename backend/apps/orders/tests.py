from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.products.models import Category, Product, Brand, ProductVariant
from apps.accounts.models import Address
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
		self.brand = Brand.objects.create(name='Brand', slug='brand', description='', is_active=True)
		self.product = Product.objects.create(
			name='Product',
			slug='product',
			description='desc',
			category=self.category,
			brand=self.brand,
			sku='SKU-1',
			price=Decimal('10.00'),
			stock=10,
			is_active=True,
		)

		self.shipping_address = Address.objects.create(
			user=self.user,
			address_type='shipping',
			full_name='Test User',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)
		self.billing_address = Address.objects.create(
			user=self.user,
			address_type='billing',
			full_name='Test User',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)

		self.cart = Cart.objects.create(user=self.user)
		self.item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=1)

	def test_negative_shipping_cost_rejected(self):
		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '-1.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_discount_exceeds_total_rejected(self):
		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'discount': '999.00',
			},
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
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 201)
		self.assertEqual(Order.objects.count(), 1)
		self.assertFalse(self.cart.items.filter(id=self.item.id).exists())

	def test_missing_addresses_rejected(self):
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
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_address_must_belong_to_user(self):
		User = get_user_model()
		other = User.objects.create_user(
			email='other@example.com',
			username='otheruser',
			password='password123',
		)
		other_shipping = Address.objects.create(
			user=other,
			address_type='shipping',
			full_name='Other',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)

		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': other_shipping.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_insufficient_product_stock_rejected(self):
		self.product.stock = 0
		self.product.save(update_fields=['stock'])

		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())

	def test_stock_decrement_on_success(self):
		self.product.stock = 2
		self.product.save(update_fields=['stock'])

		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 201)
		self.product.refresh_from_db()
		self.assertEqual(self.product.stock, 1)

	def test_insufficient_variant_stock_rejected(self):
		variant = ProductVariant.objects.create(
			product=self.product,
			name='Size',
			value='L',
			sku='SKU-1-L',
			price_adjustment=Decimal('0.00'),
			stock=1,
			is_active=True,
		)
		self.item.variant = variant
		self.item.quantity = 2
		self.item.save()

		res = self.client.post(
			'/api/v1/orders/create_from_cart/',
			{
				'item_ids': [self.item.id],
				'shipping_address': self.shipping_address.id,
				'billing_address': self.billing_address.id,
				'shipping_cost': '0.00',
				'tax': '0.00',
				'discount': '0.00',
			},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
		self.assertTrue(self.cart.items.filter(id=self.item.id).exists())
