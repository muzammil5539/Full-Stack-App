import uuid

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer, CreatePaymentSerializer


class PaymentRateThrottle(UserRateThrottle):
    scope = 'payment'


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Object-level permission: users can only see their own payments
        return Payment.objects.filter(order__user=self.request.user).select_related(
            'order__user',
            'order__shipping_address',
            'order__billing_address'
        ).order_by('-created_at', '-id')

    @action(detail=False, methods=['post'], throttle_classes=[PaymentRateThrottle])
    def create_for_order(self, request):
        serializer = CreatePaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        order: Order = serializer.validated_data['order']
        payment_method: str = serializer.validated_data['payment_method']

        # Object-level permission check: ensure user owns the order
        if order.user != request.user:
            return Response(
                {'error': 'You do not have permission to create payment for this order'},
                status=status.HTTP_403_FORBIDDEN
            )

        payment = Payment.objects.create(
            order=order,
            payment_method=payment_method,
            transaction_id=f"TX-{uuid.uuid4().hex}",
            amount=order.total,
            status='pending',
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
