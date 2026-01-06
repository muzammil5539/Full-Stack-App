from django.db import models
from utils.models import TimeStampedModel


class Category(TimeStampedModel):
    """Product category model."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Brand(TimeStampedModel):
    """Product brand model."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'brands'
        verbose_name = 'Brand'
        verbose_name_plural = 'Brands'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    """Product model."""
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_on_sale(self):
        return self.compare_price and self.price < self.compare_price
    
    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int(((self.compare_price - self.price) / self.compare_price) * 100)
        return 0


class ProductImage(TimeStampedModel):
    """Product image model."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.product.name} - Image {self.order}"


class ProductVariant(TimeStampedModel):
    """Product variant model for size, color, etc."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)  # e.g., "Size", "Color"
    value = models.CharField(max_length=100)  # e.g., "Large", "Red"
    sku = models.CharField(max_length=100, unique=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'product_variants'
        verbose_name = 'Product Variant'
        verbose_name_plural = 'Product Variants'
    
    def __str__(self):
        return f"{self.product.name} - {self.name}: {self.value}"


class ProductAttribute(TimeStampedModel):
    """Product attributes like specifications."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'product_attributes'
        verbose_name = 'Product Attribute'
        verbose_name_plural = 'Product Attributes'
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
