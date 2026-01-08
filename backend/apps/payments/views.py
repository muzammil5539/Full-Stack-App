import uuid
import time

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework import serializers

from apps.orders.models import Order
from utils.logging_utils import log_payment_failure
from utils.otel_utils import add_span_event, record_span_error, set_span_attributes
from utils.telemetry import (
    api_error_counter,
    payment_created_counter,
    payment_duration_histogram,
    payment_failed_counter,
    payment_success_counter,
)
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
        start_time = time.monotonic()
        base_attrs = {"endpoint": "payments.create_for_order"}

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
                try:
                    payment_success_counter.add(1, {**base_attrs, "idempotent": True})
                except Exception:
                    pass
                add_span_event("payment.idempotent_hit", {"payment_id": existing_payment.id})
                return Response(PaymentSerializer(existing_payment).data, status=status.HTTP_200_OK)

        serializer = CreatePaymentSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            try:
                payment_failed_counter.add(1, {**base_attrs, "reason": "validation_error"})
                api_error_counter.add(1, {**base_attrs, "reason": "validation_error"})
            except Exception:
                pass
            record_span_error("validation_error", "Invalid payment request", {**base_attrs})
            raise

        order: Order = serializer.validated_data['order']
        payment_method: str = serializer.validated_data['payment_method']

        set_span_attributes(
            {
                "app.operation": "payment.create_for_order",
                "user.id": request.user.id,
                "order.id": order.id,
                "payment.method": payment_method,
            }
        )

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

            try:
                payment_failed_counter.add(1, {**base_attrs, "reason": "permission_denied"})
                api_error_counter.add(1, {**base_attrs, "reason": "permission_denied"})
                payment_duration_histogram.record(
                    (time.monotonic() - start_time) * 1000.0,
                    {"status": "failed", "reason": "permission_denied"},
                )
            except Exception:
                pass
            record_span_error("permission_denied", "Cannot create payment for another user's order", {**base_attrs})
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

        try:
            payment_created_counter.add(1, {**base_attrs, "payment_method": payment_method})
            payment_success_counter.add(1, {**base_attrs, "payment_method": payment_method})
            payment_duration_histogram.record(
                (time.monotonic() - start_time) * 1000.0,
                {"status": "success"},
            )
        except Exception:
            pass

        add_span_event("payment.created", {"payment_id": payment.id})
        set_span_attributes({"payment.id": payment.id})

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
