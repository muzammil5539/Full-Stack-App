from rest_framework import serializers
from django.utils.text import slugify
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductAttribute


def _unique_slug(model, base: str, slug_field_name: str = 'slug') -> str:
    candidate = slugify(base or '')
    if not candidate:
        candidate = 'item'
    slug = candidate
    suffix = 2
    while model.objects.filter(**{slug_field_name: slug}).exists():
        slug = f"{candidate}-{suffix}"
        suffix += 1
    return slug


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            validated_data['slug'] = _unique_slug(Category, validated_data.get('name', ''))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if 'slug' in validated_data and not slug:
            validated_data['slug'] = _unique_slug(Category, validated_data.get('name', instance.name))
        return super().update(instance, validated_data)


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            validated_data['slug'] = _unique_slug(Brand, validated_data.get('name', ''))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if 'slug' in validated_data and not slug:
            validated_data['slug'] = _unique_slug(Brand, validated_data.get('name', instance.name))
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = '__all__'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            validated_data['slug'] = _unique_slug(Product, validated_data.get('name', ''))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if 'slug' in validated_data and not slug:
            validated_data['slug'] = _unique_slug(Product, validated_data.get('name', instance.name))
        return super().update(instance, validated_data)
