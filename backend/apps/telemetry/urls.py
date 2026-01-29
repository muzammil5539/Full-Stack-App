from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import telemetry_health, TelemetryTraceViewSet, TelemetrySpanViewSet

router = DefaultRouter()
router.register(r'traces', TelemetryTraceViewSet, basename='telemetry-trace')
router.register(r'spans', TelemetrySpanViewSet, basename='telemetry-span')

urlpatterns = [
    path('health/', telemetry_health, name='telemetry-health'),
    path('', include(router.urls)),
]
