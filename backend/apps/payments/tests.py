from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from decimal import Decimal
from apps.accounts.models import Address
from apps.orders.models import Order
from .models import Payment


class PaymentProofUploadTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='u1@example.com', username='u1', password='pass')
        self.other = User.objects.create_user(email='u2@example.com', username='u2', password='pass')
        self.client = APIClient()

        self.shipping = Address.objects.create(
            user=self.user,
            address_type='shipping',
            full_name='U1',
            phone='123',
            address_line1='L1',
            city='C',
            state='S',
            postal_code='11111',
            country='Country',
            is_default=True,
        )
        self.billing = Address.objects.create(
            user=self.user,
            address_type='billing',
            full_name='U1',
            phone='123',
            address_line1='L1',
            city='C',
            state='S',
            postal_code='11111',
            country='Country',
            is_default=True,
        )

        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.shipping,
            billing_address=self.billing,
            subtotal=Decimal('10.00'),
            shipping_cost=Decimal('0.00'),
            tax=Decimal('0.00'),
            discount=Decimal('0.00'),
            total=Decimal('10.00'),
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method='cash_on_delivery',
            transaction_id='T1',
            amount=self.order.total,
            status='pending',
        )

    def test_missing_file_returns_400(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post(f'/api/v1/payments/{self.payment.id}/upload_proof/', {}, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_invalid_method_rejected(self):
        # Create payment with non-COD method
        p2 = Payment.objects.create(
            order=self.order,
            payment_method='credit_card',
            transaction_id='T2',
            amount=self.order.total,
            status='pending',
        )
        self.client.force_authenticate(user=self.user)
        f = SimpleUploadedFile('proof.txt', b'fake')
        res = self.client.post(f'/api/v1/payments/{p2.id}/upload_proof/', {'proof_file': f}, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_upload_requires_ownership(self):
        self.client.force_authenticate(user=self.other)
        f = SimpleUploadedFile('proof.txt', b'fake')
        res = self.client.post(f'/api/v1/payments/{self.payment.id}/upload_proof/', {'proof_file': f}, format='multipart')
        self.assertEqual(res.status_code, 403)

    def test_successful_upload_sets_pending(self):
        self.client.force_authenticate(user=self.user)
        f = SimpleUploadedFile('proof.png', b'fakeimagecontent', content_type='image/png')
        res = self.client.post(f'/api/v1/payments/{self.payment.id}/upload_proof/', {'proof_file': f, 'note': 'Paid in cash'}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.proof_status, 'pending')
        self.assertTrue(bool(self.payment.proof_file))
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from unittest import mock

from apps.accounts.models import Address
from apps.orders.models import Order
from apps.payments.models import Payment


class PaymentBusinessMetricsTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.user = User.objects.create_user(
			email='pay-metrics@example.com',
			username='paymetrics',
			password='password123',
		)
		self.client.force_authenticate(user=self.user)

		self.shipping_address = Address.objects.create(
			user=self.user,
			address_type='shipping',
			full_name='Pay User',
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
			full_name='Pay User',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)

		self.order = Order.objects.create(
			user=self.user,
			shipping_address=self.shipping_address,
			billing_address=self.billing_address,
			subtotal=Decimal('10.00'),
			shipping_cost=Decimal('0.00'),
			tax=Decimal('0.00'),
			discount=Decimal('0.00'),
			total=Decimal('10.00'),
			notes='',
		)

	@mock.patch('apps.payments.views.payment_created_counter')
	@mock.patch('apps.payments.views.payment_success_counter')
	@mock.patch('apps.payments.views.payment_duration_histogram')
	def test_create_for_order_records_metrics_on_success(
		self,
		mock_duration,
		mock_success,
		mock_created,
	):
		res = self.client.post(
			'/api/v1/payments/create_for_order/',
			{'order': self.order.id, 'payment_method': 'stripe'},
			format='json',
		)
		self.assertEqual(res.status_code, 201)
		mock_created.add.assert_called()
		mock_success.add.assert_called()
		mock_duration.record.assert_called()

	@mock.patch('apps.payments.views.payment_failed_counter')
	@mock.patch('apps.payments.views.api_error_counter')
	@mock.patch('apps.payments.views.record_span_error')
	def test_create_for_order_records_metrics_on_validation_error(
		self,
		mock_record_error,
		mock_api_error,
		mock_failed,
	):
		res = self.client.post(
			'/api/v1/payments/create_for_order/',
			{'order': 999999, 'payment_method': 'stripe'},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		mock_failed.add.assert_called()
		mock_api_error.add.assert_called()
		mock_record_error.assert_called_once()

	def test_create_for_order_invalid_payment_method_rejected(self):
		# Invalid payment method should return 400 with field error
		res = self.client.post(
			'/api/v1/payments/create_for_order/',
			{'order': self.order.id, 'payment_method': 'not_a_method'},
			format='json',
		)
		self.assertEqual(res.status_code, 400)
		self.assertIn('payment_method', res.data)

	def test_create_for_order_cannot_create_for_other_user(self):
		# Creating a payment for another user's order should be rejected
		User = get_user_model()
		other = User.objects.create_user(email='other@example.com', username='other', password='pw')
		# create an order that belongs to the other user
		other_order = Order.objects.create(
			user=other,
			shipping_address=self.shipping_address,
			billing_address=self.billing_address,
			subtotal=Decimal('1.00'),
			shipping_cost=Decimal('0.00'),
			tax=Decimal('0.00'),
			discount=Decimal('0.00'),
			total=Decimal('1.00'),
		)
		res = self.client.post(
			'/api/v1/payments/create_for_order/',
			{'order': other_order.id, 'payment_method': 'stripe'},
			format='json',
		)
		# Serializer uses Order.objects.get(id=value, user=request.user) so this should be a 400
		self.assertEqual(res.status_code, 400)
		self.assertIn('order', res.data)


class PaymentFilterTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.owner = User.objects.create_user(
			email='pay-filter@example.com',
			username='payfilter',
			password='password123',
		)
		self.other = User.objects.create_user(
			email='someoneelse@example.com',
			username='notowner',
			password='password123',
		)

		self.client.force_authenticate(user=self.owner)

		self.shipping = Address.objects.create(
			user=self.owner,
			address_type='shipping',
			full_name='Owner',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)
		self.billing = Address.objects.create(
			user=self.owner,
			address_type='billing',
			full_name='Owner',
			phone='123',
			address_line1='Line 1',
			address_line2='',
			city='City',
			state='State',
			postal_code='00000',
			country='Country',
			is_default=True,
		)

		self.order = Order.objects.create(
			user=self.owner,
			shipping_address=self.shipping,
			billing_address=self.billing,
			subtotal=Decimal('5.00'),
			shipping_cost=Decimal('0.00'),
			tax=Decimal('0.00'),
			discount=Decimal('0.00'),
			total=Decimal('5.00'),
			notes='',
		)

		self.payment = Payment.objects.create(
			order=self.order,
			payment_method='stripe',
			transaction_id='TX-123',
			amount=Decimal('5.00'),
			status='pending',
		)

		self.other_order = Order.objects.create(
			user=self.other,
			shipping_address=self.shipping,
			billing_address=self.billing,
			subtotal=Decimal('7.00'),
			shipping_cost=Decimal('0.00'),
			tax=Decimal('0.00'),
			discount=Decimal('0.00'),
			total=Decimal('7.00'),
			notes='',
		)
		Payment.objects.create(
			order=self.other_order,
			payment_method='paypal',
			transaction_id='TX-999',
			amount=Decimal('7.00'),
			status='completed',
		)

	def test_filters_by_order_query_param_for_owner(self):
		res = self.client.get('/api/v1/payments/', {'order': self.order.id})
		self.assertEqual(res.status_code, 200, res.data)
		self.assertEqual(len(res.data['results']), 1)
		self.assertEqual(res.data['results'][0]['id'], self.payment.id)

	def test_order_filter_does_not_leak_other_users(self):
		res = self.client.get('/api/v1/payments/', {'order': self.other_order.id})
		self.assertEqual(res.status_code, 200, res.data)
		self.assertEqual(len(res.data['results']), 0)

	def test_invalid_order_filter_returns_empty(self):
		res = self.client.get('/api/v1/payments/', {'order': 'abc'})
		self.assertEqual(res.status_code, 200, res.data)
		self.assertEqual(len(res.data['results']), 0)
