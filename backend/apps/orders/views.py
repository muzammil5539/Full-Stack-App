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
            
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # Create order
                order = Order.objects.create(
                    user=request.user,
                    shipping_address_id=request.data.get('shipping_address'),
                    billing_address_id=request.data.get('billing_address'),
                    subtotal=cart.total_price,
                    shipping_cost=request.data.get('shipping_cost', 0),
                    tax=request.data.get('tax', 0),
                    discount=request.data.get('discount', 0),
                    total=cart.total_price + 
                          float(request.data.get('shipping_cost', 0)) +
                          float(request.data.get('tax', 0)) -
                          float(request.data.get('discount', 0)),
                    notes=request.data.get('notes', '')
                )
                
                # Create order items from cart
                for cart_item in cart.items.all():
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
                
                # Clear cart
                cart.items.all().delete()
            
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
