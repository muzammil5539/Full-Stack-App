from django.contrib.auth.models import Group
from rest_framework import permissions, viewsets
from rest_framework.authtoken.models import Token

from apps.accounts.models import User, Address, UserProfile
from apps.cart.models import Cart, CartItem
from apps.notifications.models import Notification
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from apps.products.models import Brand, Category, Product, ProductImage, ProductVariant, ProductAttribute
from apps.reviews.models import Review, ReviewImage
from apps.wishlist.models import Wishlist, WishlistItem

from .serializers import (
    TokenAdminSerializer,
    GroupAdminSerializer,
    UserAdminSerializer,
    AddressAdminSerializer,
    UserProfileAdminSerializer,
    NotificationAdminSerializer,
    OrderAdminSerializer,
    OrderItemAdminSerializer,
    OrderStatusHistoryAdminSerializer,
    PaymentAdminSerializer,
    BrandAdminSerializer,
    CategoryAdminSerializer,
    ProductAdminSerializer,
    ProductImageAdminSerializer,
    ProductVariantAdminSerializer,
    ProductAttributeAdminSerializer,
    ReviewAdminSerializer,
    ReviewImageAdminSerializer,
    CartAdminSerializer,
    CartItemAdminSerializer,
    WishlistAdminSerializer,
    WishlistItemAdminSerializer,
)


class AdminOnly(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]


class TokenAdminViewSet(AdminOnly):
    queryset = Token.objects.all().select_related('user')
    serializer_class = TokenAdminSerializer


class GroupAdminViewSet(AdminOnly):
    queryset = Group.objects.all()
    serializer_class = GroupAdminSerializer


class UserAdminViewSet(AdminOnly):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer


class AddressAdminViewSet(AdminOnly):
    queryset = Address.objects.all().select_related('user')
    serializer_class = AddressAdminSerializer


class UserProfileAdminViewSet(AdminOnly):
    queryset = UserProfile.objects.all().select_related('user')
    serializer_class = UserProfileAdminSerializer


class NotificationAdminViewSet(AdminOnly):
    queryset = Notification.objects.all().select_related('user')
    serializer_class = NotificationAdminSerializer


class OrderAdminViewSet(AdminOnly):
    queryset = Order.objects.all().select_related('user')
    serializer_class = OrderAdminSerializer


class OrderItemAdminViewSet(AdminOnly):
    queryset = OrderItem.objects.all().select_related('order', 'product')
    serializer_class = OrderItemAdminSerializer


class OrderStatusHistoryAdminViewSet(AdminOnly):
    queryset = OrderStatusHistory.objects.all().select_related('order')
    serializer_class = OrderStatusHistoryAdminSerializer


class PaymentAdminViewSet(AdminOnly):
    queryset = Payment.objects.all().select_related('order')
    serializer_class = PaymentAdminSerializer


class BrandAdminViewSet(AdminOnly):
    queryset = Brand.objects.all()
    serializer_class = BrandAdminSerializer


class CategoryAdminViewSet(AdminOnly):
    queryset = Category.objects.all()
    serializer_class = CategoryAdminSerializer


class ProductAdminViewSet(AdminOnly):
    queryset = Product.objects.all().select_related('category', 'brand')
    serializer_class = ProductAdminSerializer


class ProductImageAdminViewSet(AdminOnly):
    queryset = ProductImage.objects.all().select_related('product')
    serializer_class = ProductImageAdminSerializer


class ProductVariantAdminViewSet(AdminOnly):
    queryset = ProductVariant.objects.all().select_related('product')
    serializer_class = ProductVariantAdminSerializer


class ProductAttributeAdminViewSet(AdminOnly):
    queryset = ProductAttribute.objects.all().select_related('product')
    serializer_class = ProductAttributeAdminSerializer


class ReviewAdminViewSet(AdminOnly):
    queryset = Review.objects.all().select_related('product', 'user')
    serializer_class = ReviewAdminSerializer


class ReviewImageAdminViewSet(AdminOnly):
    queryset = ReviewImage.objects.all().select_related('review')
    serializer_class = ReviewImageAdminSerializer


class CartAdminViewSet(AdminOnly):
    queryset = Cart.objects.all().select_related('user')
    serializer_class = CartAdminSerializer


class CartItemAdminViewSet(AdminOnly):
    queryset = CartItem.objects.all().select_related('cart', 'product')
    serializer_class = CartItemAdminSerializer


class WishlistAdminViewSet(AdminOnly):
    queryset = Wishlist.objects.all().select_related('user')
    serializer_class = WishlistAdminSerializer


class WishlistItemAdminViewSet(AdminOnly):
    queryset = WishlistItem.objects.all().select_related('wishlist', 'product')
    serializer_class = WishlistItemAdminSerializer
