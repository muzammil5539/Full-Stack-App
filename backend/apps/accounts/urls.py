from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import UserViewSet, AddressViewSet, UserProfileViewSet, RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'profiles', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('token/', obtain_auth_token, name='token'),
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
