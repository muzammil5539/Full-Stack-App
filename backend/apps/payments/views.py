import uuid

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.orders.models import Order
from utils.logging_utils import log_payment_failure
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
        """Create payment for order with idempotency support."""
        # Check for idempotency key
        idempotency_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
        
        if idempotency_key:
            # Check if payment with this idempotency key already exists
            existing_payment = Payment.objects.filter(
                order__user=request.user,
                idempotency_key=idempotency_key
            ).first()
            
            if existing_payment:
                # Return existing payment (idempotent response)
                return Response(PaymentSerializer(existing_payment).data, status=status.HTTP_200_OK)
        
        serializer = CreatePaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        order: Order = serializer.validated_data['order']
        payment_method: str = serializer.validated_data['payment_method']

        # Object-level permission check: ensure user owns the order
        if order.user != request.user:
            # Log unauthorized payment attempt
            log_payment_failure(
                user_id=request.user.id,
                order_id=order.id,
                payment_id=None,
                error_type='permission_denied',
                error_message='User attempted to create payment for another user\'s order',
                context={'attempted_order_user_id': order.user_id}
            )
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
            idempotency_key=idempotency_key,  # Save idempotency key
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
