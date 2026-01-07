from rest_framework import serializers

from apps.orders.models import Order
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'payment_date']


class CreatePaymentSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=[c[0] for c in Payment.PAYMENT_METHODS])

    def validate_order(self, value):
        request = self.context.get('request')
        if request is None or request.user.is_anonymous:
            raise serializers.ValidationError('Authentication required')

        try:
            order = Order.objects.get(id=value, user=request.user)
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found')

        if order.status == 'cancelled':
            raise serializers.ValidationError('Cannot pay for a cancelled order')

        return order
