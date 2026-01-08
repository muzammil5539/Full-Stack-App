from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, Address
from apps.products.models import Category, Product
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment


class OrderStatusTransitionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
        )

        self.category = Category.objects.create(name='Test', slug='test')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test',
            category=self.category,
            sku='TEST-SKU',
            price='10.00',
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

        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            billing_address=self.address,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price='10.00',
        )

    def test_admin_can_update_order_status(self):
        """Test that admin can update order status"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'confirmed',
            'notes': 'Order confirmed by admin',
        })
        self.assertEqual(response.status_code, 200)
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')
        
        # Check status history was created
        history = OrderStatusHistory.objects.filter(order=self.order, status='confirmed')
        self.assertTrue(history.exists())

    def test_non_admin_cannot_update_order_status(self):
        """Test that non-admin users cannot update order status"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'confirmed',
        })
        self.assertEqual(response.status_code, 403)

    def test_update_status_invalid_status(self):
        """Test update with invalid status"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'invalid_status',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_update_status_same_status(self):
        """Test update to the same status"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'pending',
        })
        self.assertEqual(response.status_code, 400)


class PaymentStatusUpdatesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
        )

        self.category = Category.objects.create(name='Test', slug='test')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test',
            category=self.category,
            sku='TEST-SKU',
            price='10.00',
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

        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            billing_address=self.address,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method='credit_card',
            transaction_id='TEST-TX-123',
            amount='10.00',
            status='pending',
        )

    def test_payment_status_updates_when_order_confirmed(self):
        """Test that payment status updates to completed when order is confirmed"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'confirmed',
        })
        self.assertEqual(response.status_code, 200)
        
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')

    def test_payment_status_updates_when_order_cancelled(self):
        """Test that pending payment is cancelled when order is cancelled"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'cancelled',
        })
        self.assertEqual(response.status_code, 200)
        
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'cancelled')

    def test_payment_status_updates_when_order_refunded(self):
        """Test that payment is refunded when order is refunded"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/v1/orders/{self.order.id}/update_status/', {
            'status': 'refunded',
        })
        self.assertEqual(response.status_code, 200)
        
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'refunded')
