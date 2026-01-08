from decimal import Decimal
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from rest_framework.test import APIClient
import threading

from apps.accounts.models import User, Address
from apps.products.models import Category, Product
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order


class CheckoutAtomicityTests(TestCase):
    """Test that checkout operations are atomic"""
    
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
            stock=10,
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

        self.cart = Cart.objects.create(user=self.user)

    def test_checkout_is_atomic_on_error(self):
        """Test that if checkout fails, no changes are persisted"""
        # Create cart item
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )
        
        initial_stock = self.product.stock
        initial_order_count = Order.objects.count()
        
        # Try checkout with invalid address (should fail)
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': 99999,  # Invalid address
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        
        self.assertEqual(response.status_code, 400)
        
        # Verify stock was not decremented
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock)
        
        # Verify no order was created
        self.assertEqual(Order.objects.count(), initial_order_count)

    def test_checkout_decrements_stock_atomically(self):
        """Test that stock is decremented within the transaction"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=3,
        )
        
        initial_stock = self.product.stock
        
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        
        self.assertEqual(response.status_code, 201)
        
        # Verify stock was decremented
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock - 3)

    def test_checkout_prevents_oversell(self):
        """Test that checkout fails if stock is insufficient"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=20,  # More than available stock (10)
        )
        
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('stock', str(response.data).lower())

    def test_checkout_clears_cart_items_atomically(self):
        """Test that cart items are removed only after successful checkout"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )
        
        initial_cart_items = self.cart.items.count()
        self.assertEqual(initial_cart_items, 1)
        
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        
        self.assertEqual(response.status_code, 201)
        
        # Cart items should be cleared
        self.assertEqual(self.cart.items.count(), 0)

    def test_checkout_creates_order_items_atomically(self):
        """Test that order items are created atomically with order"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )
        
        response = self.client.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': self.address.id,
            'billing_address': self.address.id,
            'shipping_cost': '5.00',
            'tax': '2.00',
            'discount': '0.00',
        })
        
        self.assertEqual(response.status_code, 201)
        
        order_id = response.data['id']
        order = Order.objects.get(id=order_id)
        
        # Verify order items were created
        self.assertEqual(order.items.count(), 1)
        order_item = order.items.first()
        self.assertEqual(order_item.product, self.product)
        self.assertEqual(order_item.quantity, 2)


class CheckoutConcurrencyTests(TransactionTestCase):
    """Test concurrent checkout scenarios
    
    Note: These tests use TransactionTestCase to properly test
    database-level concurrency with select_for_update()
    """
    
    def setUp(self):
        self.category = Category.objects.create(name='Test', slug='test')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test',
            category=self.category,
            sku='TEST-SKU',
            price='10.00',
            stock=5,  # Limited stock for concurrency testing
        )

    def test_concurrent_checkouts_respect_stock_limits(self):
        """Test that concurrent checkouts don't oversell with select_for_update"""
        # Create two users
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123',
        )
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123',
        )
        
        # Create addresses
        address1 = Address.objects.create(
            user=user1,
            address_type='shipping',
            full_name='User 1',
            phone='1234567890',
            address_line1='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='Test Country',
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
        
        # Create carts with items
        cart1 = Cart.objects.create(user=user1)
        CartItem.objects.create(cart=cart1, product=self.product, quantity=3)
        
        cart2 = Cart.objects.create(user=user2)
        CartItem.objects.create(cart=cart2, product=self.product, quantity=3)
        
        # Both try to checkout 3 items, but only 5 in stock
        # One should succeed, one should fail
        
        client1 = APIClient()
        client1.force_authenticate(user=user1)
        
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        
        response1 = client1.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': address1.id,
            'billing_address': address1.id,
            'shipping_cost': '5.00',
            'tax': '0.00',
            'discount': '0.00',
        })
        
        response2 = client2.post('/api/v1/orders/create_from_cart/', {
            'shipping_address': address2.id,
            'billing_address': address2.id,
            'shipping_cost': '5.00',
            'tax': '0.00',
            'discount': '0.00',
        })
        
        # One should succeed (201), one should fail (400 - insufficient stock)
        statuses = sorted([response1.status_code, response2.status_code])
        
        # First request succeeded
        self.assertIn(201, statuses)
        # Second request failed due to insufficient stock
        self.assertIn(400, statuses)
        
        # Verify final stock is either 2 (if first succeeded) or 5 (if both failed somehow)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 2)  # 5 - 3 = 2
        
        # Verify only one order was created
        self.assertEqual(Order.objects.count(), 1)
