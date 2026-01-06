from django.contrib.auth.models import Group
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from apps.accounts.models import User, Address, UserProfile
from apps.cart.models import Cart, CartItem
from apps.notifications.models import Notification
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from apps.products.models import Brand, Category, Product, ProductImage, ProductVariant, ProductAttribute
from apps.reviews.models import Review, ReviewImage
from apps.wishlist.models import Wishlist, WishlistItem


class TokenAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = '__all__'
        read_only_fields = ['key']


class GroupAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password', '')
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password is not None:
            if password:
                instance.set_password(password)
            else:
                instance.set_unusable_password()
        instance.save()
        return instance


class AddressAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'


class UserProfileAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'


class NotificationAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class OrderAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number']


class OrderItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderStatusHistoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'


class PaymentAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class BrandAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base = slugify(validated_data.get('name', '') or '') or 'brand'
            candidate = base
            suffix = 2
            while Brand.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1
            validated_data['slug'] = candidate
        return super().create(validated_data)


class CategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base = slugify(validated_data.get('name', '') or '') or 'category'
            candidate = base
            suffix = 2
            while Category.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1
            validated_data['slug'] = candidate
        return super().create(validated_data)


class ProductAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base = slugify(validated_data.get('name', '') or '') or 'product'
            candidate = base
            suffix = 2
            while Product.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1
            validated_data['slug'] = candidate
        return super().create(validated_data)


class ProductImageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'


class ProductVariantAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductAttributeAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = '__all__'


class ReviewAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'


class ReviewImageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = '__all__'


class CartAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = '__all__'


class CartItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'


class WishlistAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = '__all__'


class WishlistItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = '__all__'
