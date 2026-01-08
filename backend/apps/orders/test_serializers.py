from django.test import TestCase, override_settings
from django.test.utils import override_settings
from rest_framework.test import APIClient, APIRequestFactory
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.accounts.models import User, Address
from apps.products.models import Category, Brand, Product, ProductImage, ProductVariant, ProductAttribute
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer
from apps.products.serializers import ProductSerializer


class OrderSerializerCompletenessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
        )
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.brand = Brand.objects.create(name='Test Brand', slug='test-brand')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test description',
            category=self.category,
            brand=self.brand,
            sku='TEST-SKU',
            price='10.00',
            stock=100,
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='Size',
            value='Large',
            sku='TEST-SKU-L',
            price_adjustment='2.00',
            stock=50,
        )

        self.shipping_address = Address.objects.create(
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

        self.billing_address = Address.objects.create(
            user=self.user,
            address_type='billing',
            full_name='Test User',
            phone='1234567890',
            address_line1='456 Billing St',
            city='Billing City',
            state='Billing State',
            postal_code='54321',
            country='Test Country',
        )

        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.shipping_address,
            billing_address=self.billing_address,
            subtotal='10.00',
            shipping_cost='5.00',
            tax='1.00',
            total='16.00',
            status='pending',
        )

        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            variant=self.variant,
            quantity=1,
            price='10.00',
        )

    def test_order_includes_items(self):
        """Test that order serializer includes items"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('items', response.data)
        self.assertEqual(len(response.data['items']), 1)

    def test_order_includes_product_details(self):
        """Test that order items include product details"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        item = response.data['items'][0]
        self.assertIn('product_details', item)
        self.assertEqual(item['product_details']['name'], 'Test Product')
        self.assertEqual(item['product_details']['sku'], 'TEST-SKU')

    def test_order_includes_variant_details(self):
        """Test that order items include variant details"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        item = response.data['items'][0]
        self.assertIn('variant_details', item)
        self.assertEqual(item['variant_details']['name'], 'Size')
        self.assertEqual(item['variant_details']['value'], 'Large')

    def test_order_includes_shipping_address_details(self):
        """Test that order includes shipping address details"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('shipping_address_details', response.data)
        self.assertEqual(response.data['shipping_address_details']['full_name'], 'Test User')
        self.assertEqual(response.data['shipping_address_details']['city'], 'Test City')

    def test_order_includes_billing_address_details(self):
        """Test that order includes billing address details"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('billing_address_details', response.data)
        self.assertEqual(response.data['billing_address_details']['full_name'], 'Test User')
        self.assertEqual(response.data['billing_address_details']['city'], 'Billing City')

    def test_order_includes_status_history(self):
        """Test that order includes status history"""
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('status_history', response.data)
        self.assertIsInstance(response.data['status_history'], list)


class ProductSerializerCompletenessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.factory = APIRequestFactory()

        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.brand = Brand.objects.create(name='Test Brand', slug='test-brand')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test description',
            category=self.category,
            brand=self.brand,
            sku='TEST-SKU',
            price='10.00',
            compare_price='15.00',
            stock=100,
        )

        self.image1 = ProductImage.objects.create(
            product=self.product,
            alt_text='Test Image 1',
            is_primary=True,
            order=0,
        )

        self.image2 = ProductImage.objects.create(
            product=self.product,
            alt_text='Test Image 2',
            is_primary=False,
            order=1,
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='Size',
            value='Medium',
            sku='TEST-SKU-M',
            price_adjustment='0.00',
            stock=50,
        )

        self.attribute = ProductAttribute.objects.create(
            product=self.product,
            name='Material',
            value='Cotton',
        )

    def test_product_includes_images(self):
        """Test that product serializer includes images"""
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('images', response.data)
        self.assertEqual(len(response.data['images']), 2)

    def test_product_includes_variants(self):
        """Test that product serializer includes variants"""
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('variants', response.data)
        self.assertEqual(len(response.data['variants']), 1)
        self.assertEqual(response.data['variants'][0]['name'], 'Size')

    def test_product_includes_attributes(self):
        """Test that product serializer includes attributes"""
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('attributes', response.data)
        self.assertEqual(len(response.data['attributes']), 1)
        self.assertEqual(response.data['attributes'][0]['name'], 'Material')

    def test_product_includes_computed_fields(self):
        """Test that product includes is_on_sale and discount_percentage"""
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('is_on_sale', response.data)
        self.assertIn('discount_percentage', response.data)
        self.assertTrue(response.data['is_on_sale'])
        self.assertGreater(response.data['discount_percentage'], 0)

    def test_product_includes_category_and_brand_names(self):
        """Test that product includes category and brand names"""
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('category_name', response.data)
        self.assertIn('brand_name', response.data)
        self.assertEqual(response.data['category_name'], 'Test Category')
        self.assertEqual(response.data['brand_name'], 'Test Brand')

    def test_image_has_absolute_url(self):
        """Test that product images include absolute URLs"""
        request = self.factory.get('/api/v1/products/')
        request.META['HTTP_HOST'] = 'testserver'
        
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, 200)
        
        if response.data['images']:
            image = response.data['images'][0]
            self.assertIn('image_url', image)
