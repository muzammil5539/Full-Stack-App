from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import UserViewSet, AddressViewSet, UserProfileViewSet, RegisterView, AuthRateThrottle

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'profiles', UserProfileViewSet, basename='profile')

# Apply throttling to token endpoint
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response as DRFResponse

@api_view(['POST'])
@throttle_classes([AuthRateThrottle])
def token_view(request):
    return obtain_auth_token(request)

urlpatterns = [
    path('token/', token_view, name='token'),
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
