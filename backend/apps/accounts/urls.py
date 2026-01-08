from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import ObtainAuthToken
from .views import UserViewSet, AddressViewSet, UserProfileViewSet, RegisterView, AuthRateThrottle

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'profiles', UserProfileViewSet, basename='profile')


class ThrottledObtainAuthToken(ObtainAuthToken):
    throttle_classes = [AuthRateThrottle]


urlpatterns = [
    path('token/', ThrottledObtainAuthToken.as_view(), name='token'),
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
