from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.products.models import Brand, Category, Product, ProductVariant


class AdminSkuAutoGenerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
        )
        self.client.force_authenticate(user=self.admin)

        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.brand = Brand.objects.create(name='Test Brand', slug='test-brand')

    def test_admin_product_create_generates_sku_when_missing(self):
        payload = {
            'name': 'Test Product',
            'description': 'Desc',
            'short_description': '',
            'category': self.category.id,
            'brand': self.brand.id,
            'sku': '',
            'slug': '',
            'price': '10.00',
            'compare_price': None,
            'cost_price': None,
            'stock': 0,
            'low_stock_threshold': 5,
            'weight': None,
            'is_active': True,
            'is_featured': False,
            'views_count': 0,
        }

        res = self.client.post('/api/v1/admin/products/products/', payload, format='json')
        self.assertEqual(res.status_code, 201, res.data)

        product = Product.objects.get(id=res.data['id'])
        self.assertTrue(product.sku)
        self.assertNotEqual(product.sku.strip(), '')
        self.assertTrue(product.slug)
        self.assertNotEqual(product.slug.strip(), '')

    def test_admin_variant_create_generates_sku_when_blank(self):
        product = Product.objects.create(
            name='P1',
            slug='p1',
            description='d',
            category=self.category,
            brand=self.brand,
            sku='P1-TESTSKU',
            price='1.00',
        )

        payload = {
            'product': product.id,
            'name': 'Size',
            'value': 'Large',
            'sku': '',
            'price_adjustment': '0.00',
            'stock': 0,
            'is_active': True,
        }

        res = self.client.post('/api/v1/admin/products/productvariants/', payload, format='json')
        self.assertEqual(res.status_code, 201, res.data)

        variant = ProductVariant.objects.get(id=res.data['id'])
        self.assertTrue(variant.sku)
        self.assertNotEqual(variant.sku.strip(), '')
