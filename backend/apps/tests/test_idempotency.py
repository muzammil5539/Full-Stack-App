from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, Address
from apps.products.models import Category, Product
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.payments.models import Payment


class CheckoutIdempotencyTests(TestCase):
    """Test idempotency of checkout operations"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
        )
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Test', slug='test')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test',
            category=self.category,
            sku='TEST-SKU',
            price='10.00',
            stock=100,
        )

        self.address = Address.objects.create(
            user=self.user,
            address_type='shipping',
            full_name='Test User',
            phone='1234567890',
            address_line1='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='Test Country',
        )

    def test_checkout_without_idempotency_key_creates_multiple_orders(self):
        """Test that without idempotency key, multiple requests create multiple orders"""
        # Create cart
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        initial_order_count = Order.objects.count()
        
        # First request
        response1 = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        self.assertEqual(response1.status_code, 201)
        
        # Recreate cart for second request
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        # Second request (without idempotency key)
        response2 = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        self.assertEqual(response2.status_code, 201)
        
        # Two separate orders should be created
        self.assertEqual(Order.objects.count(), initial_order_count + 2)
        self.assertNotEqual(response1.data['id'], response2.data['id'])

    def test_checkout_with_idempotency_key_returns_same_order(self):
        """Test that with idempotency key, duplicate requests return same order"""
        # Create cart
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        idempotency_key = 'test-key-12345'
        initial_order_count = Order.objects.count()
        
        # First request
        response1 = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
            'idempotency_key': idempotency_key,
        })
        self.assertEqual(response1.status_code, 201)
        order1_id = response1.data['id']
        
        # Second request with same idempotency key
        response2 = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
            'idempotency_key': idempotency_key,
        })
        
        # Should return 200 (not 201) with same order
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.data['id'], order1_id)
        
        # Only one order should be created
        self.assertEqual(Order.objects.count(), initial_order_count + 1)

    def test_checkout_idempotency_key_via_header(self):
        """Test idempotency key can be provided via header"""
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        idempotency_key = 'header-key-67890'
        
        # First request with header
        response1 = self.client.post(
            '/api/v1/orders/create_from_cart/',
            {
                'shipping_address': self.address.id,
                'billing_address': self.address.id,
                'shipping_cost': '5.00',
                'tax': '2.00',
                'discount': '0.00',
            },
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        self.assertEqual(response1.status_code, 201)
        order1_id = response1.data['id']
        
        # Second request with same header
        response2 = self.client.post(
            '/api/v1/orders/create_from_cart/',
            {
                'shipping_address': self.address.id,
                'billing_address': self.address.id,
                'shipping_cost': '5.00',
                'tax': '2.00',
                'discount': '0.00',
            },
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.data['id'], order1_id)

    def test_different_users_can_use_same_idempotency_key(self):
        """Test that different users can use the same idempotency key"""
        # Create another user
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123',
        )
        
        address2 = Address.objects.create(
            user=user2,
            address_type='shipping',
            full_name='User 2',
            phone='0987654321',
            address_line1='456 Test Ave',
            city='Test City',
            state='Test State',
            postal_code='54321',
            country='Test Country',
        )
        
        idempotency_key = 'shared-key'
        
        # User 1 creates order
        cart1 = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart1, product=self.product, quantity=2)
        
        response1 = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '0.00',
            'discount': '0.00',
            'idempotency_key': idempotency_key,
        })
        self.assertEqual(response1.status_code, 201)
        
        # User 2 creates order with same key
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        
        cart2 = Cart.objects.create(user=user2)
        CartItem.objects.create(cart=cart2, product=self.product, quantity=3)
        
        response2 = client2.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': address2.id,
            'billing_address': address2.id,
            'shipping_cost': '5.00',
            'tax': '0.00',
            'discount': '0.00',
            'idempotency_key': idempotency_key,
        })
        self.assertEqual(response2.status_code, 201)
        
        # Should create separate orders (different users)
        self.assertNotEqual(response1.data['id'], response2.data['id'])


class PaymentIdempotencyTests(TestCase):
    """Test idempotency of payment operations"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
        )
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Test', slug='test')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test',
            category=self.category,
            sku='TEST-SKU',
            price='10.00',
            stock=100,
        )

        self.address = Address.objects.create(
            user=self.user,
            address_type='shipping',
            full_name='Test User',
            phone='1234567890',
            address_line1='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='Test Country',
        )

        # Create an order
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        self.order = Order.objects.get(id=response.data['id'])

    def test_payment_with_idempotency_key_returns_same_payment(self):
        """Test that duplicate payment requests with same key return same payment"""
        idempotency_key = 'payment-key-123'
        initial_payment_count = Payment.objects.count()
        
        # First request
        response1 = self.client.post('/api/v1/payments/create_for_order/', {
            'order': self.order.id,
            'payment_method': 'credit_card',
            'idempotency_key': idempotency_key,
        })
        self.assertEqual(response1.status_code, 201)
        payment1_id = response1.data['id']
        
        # Second request with same idempotency key
        response2 = self.client.post('/api/v1/payments/create_for_order/', {
            'order': self.order.id,
            'payment_method': 'credit_card',
            'idempotency_key': idempotency_key,
        })
        
        # Should return 200 with same payment
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.data['id'], payment1_id)
        
        # Only one payment should be created
        self.assertEqual(Payment.objects.count(), initial_payment_count + 1)

    def test_payment_idempotency_key_via_header(self):
        """Test payment idempotency key can be provided via header"""
        idempotency_key = 'payment-header-456'
        
        # First request
        response1 = self.client.post(
            '/api/v1/payments/create_for_order/',
            {
                'order': self.order.id,
                'payment_method': 'credit_card',
            },
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        self.assertEqual(response1.status_code, 201)
        payment1_id = response1.data['id']
        
        # Second request with same header
        response2 = self.client.post(
            '/api/v1/payments/create_for_order/',
            {
                'order': self.order.id,
                'payment_method': 'credit_card',
            },
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.data['id'], payment1_id)
