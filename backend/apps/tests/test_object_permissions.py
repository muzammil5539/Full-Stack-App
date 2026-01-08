from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, Address
from apps.products.models import Category, Product
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment


class PaymentObjectLevelPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123',
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
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

        self.address1 = Address.objects.create(
            user=self.user1,
            address_type='shipping',
            full_name='User 1',
            phone='1234567890',
            address_line1='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='Test Country',
        )

        self.address2 = Address.objects.create(
            user=self.user2,
            address_type='shipping',
            full_name='User 2',
            phone='0987654321',
            address_line1='456 Test Ave',
            city='Test City',
            state='Test State',
            postal_code='54321',
            country='Test Country',
        )

        self.order1 = Order.objects.create(
            user=self.user1,
            shipping_address=self.address1,
            billing_address=self.address1,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

        self.order2 = Order.objects.create(
            user=self.user2,
            shipping_address=self.address2,
            billing_address=self.address2,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

    def test_user_cannot_create_payment_for_another_users_order(self):
        """Test that user cannot create payment for another user's order"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.post('/api/v1/payments/create_for_order/', {
            'order': self.order2.id,
            'payment_method': 'credit_card',
        })
        
        # Should be 400 because serializer validation prevents access to other users' orders
        # (returns "Order not found" which is better for security than revealing order exists)
        self.assertEqual(response.status_code, 400)
        self.assertIn('order', response.data)

    def test_user_can_create_payment_for_own_order(self):
        """Test that user can create payment for their own order"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.post('/api/v1/payments/create_for_order/', {
            'order': self.order1.id,
            'payment_method': 'credit_card',
        })
        
        # Should be successful
        self.assertEqual(response.status_code, 201)

    def test_user_can_only_see_own_payments(self):
        """Test that users can only see their own payments"""
        payment1 = Payment.objects.create(
            order=self.order1,
            payment_method='credit_card',
            transaction_id='TX-1',
            amount='10.00',
            status='completed',
        )
        payment2 = Payment.objects.create(
            order=self.order2,
            payment_method='credit_card',
            transaction_id='TX-2',
            amount='10.00',
            status='completed',
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/payments/')
        
        self.assertEqual(response.status_code, 200)
        # User1 should only see payment1
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], payment1.id)

    def test_user_cannot_view_another_users_payment(self):
        """Test that user cannot view another user's payment detail"""
        payment2 = Payment.objects.create(
            order=self.order2,
            payment_method='credit_card',
            transaction_id='TX-2',
            amount='10.00',
            status='completed',
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/payments/{payment2.id}/')
        
        # Should be 404 because filtered queryset doesn't include it
        self.assertEqual(response.status_code, 404)


class OrderObjectLevelPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123',
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
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

        self.address1 = Address.objects.create(
            user=self.user1,
            address_type='shipping',
            full_name='User 1',
            phone='1234567890',
            address_line1='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='Test Country',
        )

        self.address2 = Address.objects.create(
            user=self.user2,
            address_type='shipping',
            full_name='User 2',
            phone='0987654321',
            address_line1='456 Test Ave',
            city='Test City',
            state='Test State',
            postal_code='54321',
            country='Test Country',
        )

        self.order1 = Order.objects.create(
            user=self.user1,
            shipping_address=self.address1,
            billing_address=self.address1,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

        self.order2 = Order.objects.create(
            user=self.user2,
            shipping_address=self.address2,
            billing_address=self.address2,
            subtotal='10.00',
            total='10.00',
            status='pending',
        )

    def test_user_can_only_see_own_orders(self):
        """Test that users can only see their own orders"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/orders/')
        
        self.assertEqual(response.status_code, 200)
        # User1 should only see order1
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.order1.id)

    def test_user_cannot_view_another_users_order(self):
        """Test that user cannot view another user's order detail"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/orders/{self.order2.id}/')
        
        # Should be 404 because filtered queryset doesn't include it
        self.assertEqual(response.status_code, 404)

    def test_user_cannot_cancel_another_users_order(self):
        """Test that user cannot cancel another user's order"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/v1/orders/{self.order2.id}/cancel/')
        
        # Should be 404 because filtered queryset doesn't include it
        self.assertEqual(response.status_code, 404)
