from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductAttribute

class ProductDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create category and brand
        self.category = Category.objects.create(
            name="Electronics",
            slug="electronics",
            description="Electronic gadgets"
        )
        self.brand = Brand.objects.create(
            name="TechCorp",
            slug="techcorp",
            description="Quality technology"
        )

        # Create a featured, active product
        self.product = Product.objects.create(
            name="Smartphone X",
            slug="smartphone-x",
            description="Latest flagship smartphone",
            short_description="Flagship smartphone",
            category=self.category,
            brand=self.brand,
            sku="SM-X-001",
            price=999.99,
            compare_price=1099.99,
            stock=50,
            is_active=True,
            is_featured=True
        )

        # Add product image
        self.image = ProductImage.objects.create(
            product=self.product,
            alt_text="Front view",
            is_primary=True,
            order=0
        )

        # Add product variant
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Color",
            value="Black",
            sku="SM-X-001-B",
            stock=25
        )

        # Add product attribute
        self.attribute = ProductAttribute.objects.create(
            product=self.product,
            name="RAM",
            value="8GB"
        )

        # Inactive product
        self.inactive_product = Product.objects.create(
            name="Old Phone",
            slug="old-phone",
            description="Obsolete phone",
            category=self.category,
            brand=self.brand,
            sku="SM-OLD",
            price=100.00,
            is_active=False
        )

    def test_product_detail_success(self):
        """Test retrieving a product detail by slug."""
        url = reverse('product-detail', kwargs={'slug': self.product.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product.name)
        self.assertEqual(response.data['slug'], self.product.slug)
        self.assertEqual(response.data['sku'], self.product.sku)
        # Handle decimal to float comparison
        self.assertEqual(float(response.data['price']), float(self.product.price))

    def test_product_detail_nested_data(self):
        """Test that product detail includes nested and computed data."""
        url = reverse('product-detail', kwargs={'slug': self.product.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check category and brand names (flattened in serializer)
        self.assertEqual(response.data['category_name'], self.category.name)
        self.assertEqual(response.data['brand_name'], self.brand.name)

        # Check computed fields from Product model properties and SerializerMethodFields
        self.assertTrue(response.data['is_on_sale'])
        self.assertEqual(response.data['discount_percentage'], 9)  # (1099.99-999.99)/1099.99 = 0.0909...

        # Check nested images
        self.assertEqual(len(response.data['images']), 1)
        self.assertEqual(response.data['images'][0]['alt_text'], self.image.alt_text)

        # Check nested variants
        self.assertEqual(len(response.data['variants']), 1)
        self.assertEqual(response.data['variants'][0]['value'], self.variant.value)

        # Check nested attributes
        self.assertEqual(len(response.data['attributes']), 1)
        self.assertEqual(response.data['attributes'][0]['name'], self.attribute.name)
        self.assertEqual(response.data['attributes'][0]['value'], self.attribute.value)

    def test_product_detail_not_found(self):
        """Test 404 for non-existent product slug."""
        url = reverse('product-detail', kwargs={'slug': 'non-existent-slug'})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_product_detail_inactive_product(self):
        """Test that inactive products return 404."""
        # ProductViewSet.get_queryset() filters by is_active=True
        url = reverse('product-detail', kwargs={'slug': self.inactive_product.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
