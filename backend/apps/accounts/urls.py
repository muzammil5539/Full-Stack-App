from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AddressViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'profiles', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
]
