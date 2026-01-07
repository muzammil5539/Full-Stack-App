from decimal import Decimal

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer
from apps.cart.models import Cart


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')
    
    @action(detail=False, methods=['post'])
    def create_from_cart(self, request):
        """Create order from cart."""
        try:
            cart = Cart.objects.get(user=request.user)

            item_ids = request.data.get('item_ids', None)
            items_qs = cart.items.all()
            if isinstance(item_ids, list):
                if len(item_ids) == 0:
                    return Response({'error': 'No items selected'}, status=status.HTTP_400_BAD_REQUEST)
                items_qs = items_qs.filter(id__in=item_ids)

            if not items_qs.exists():
                return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                shipping_cost = Decimal(str(request.data.get('shipping_cost', 0) or 0))
                tax = Decimal(str(request.data.get('tax', 0) or 0))
                discount = Decimal(str(request.data.get('discount', 0) or 0))

                subtotal = sum((i.subtotal for i in items_qs), Decimal('0'))

                # Create order
                order = Order.objects.create(
                    user=request.user,
                    shipping_address_id=request.data.get('shipping_address'),
                    billing_address_id=request.data.get('billing_address'),
                    subtotal=subtotal,
                    shipping_cost=shipping_cost,
                    tax=tax,
                    discount=discount,
                    total=subtotal + shipping_cost + tax - discount,
                    notes=request.data.get('notes', '')
                )
                
                # Create order items from cart
                for cart_item in items_qs:
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        variant=cart_item.variant,
                        quantity=cart_item.quantity,
                        price=cart_item.price
                    )
                
                # Create status history
                OrderStatusHistory.objects.create(
                    order=order,
                    status='pending',
                    notes='Order created'
                )
                
                # Remove ordered items from cart
                items_qs.delete()
            
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Cart.DoesNotExist:
            return Response(
                {'error': 'Cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order."""
        order = self.get_object()
        
        if order.status in ['shipped', 'delivered', 'cancelled']:
            return Response(
                {'error': 'Cannot cancel order in current status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        OrderStatusHistory.objects.create(
            order=order,
            status='cancelled',
            notes=request.data.get('notes', 'Cancelled by customer')
        )
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
