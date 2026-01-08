from decimal import Decimal, InvalidOperation
import time
from typing import Optional

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.db import transaction
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer
from apps.cart.models import Cart
from apps.accounts.models import Address
from apps.products.models import Product, ProductVariant
from utils.decimal_utils import validate_money_field, round_currency
from utils.logging_utils import log_checkout_failure, log_stock_insufficient, log_order_status_change
from utils.otel_utils import add_span_event, record_span_error, set_span_attributes
from utils.telemetry import (
    api_error_counter,
    checkout_completed_counter,
    checkout_duration_histogram,
    checkout_failed_counter,
    checkout_started_counter,
    order_created_counter,
)


class CheckoutRateThrottle(UserRateThrottle):
    scope = 'checkout'


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Admins can see all orders, regular users see only their own
        if self.request.user.is_staff:
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.filter(user=self.request.user)
        
        return queryset.select_related(
            'user',
            'shipping_address',
            'billing_address'
        ).prefetch_related(
            'items__product__category',
            'items__product__brand',
            'items__product__images',
            'items__variant',
            'status_history'
        ).order_by('-created_at', '-id')
    
    @action(detail=False, methods=['post'], throttle_classes=[CheckoutRateThrottle])
    def create_from_cart(self, request):
        """Create order from cart with idempotency support."""
        start_time = time.monotonic()
        base_attrs = {
            "endpoint": "orders.create_from_cart",
        }

        try:
            checkout_started_counter.add(1, base_attrs)
        except Exception:
            pass

        set_span_attributes({"app.operation": "checkout.create_from_cart", "user.id": request.user.id})

        def _record_failure(reason: str, extra_attrs: Optional[dict] = None):
            attrs = dict(base_attrs)
            attrs["reason"] = reason
            if extra_attrs:
                attrs.update(extra_attrs)

            try:
                checkout_failed_counter.add(1, attrs)
            except Exception:
                pass
            try:
                api_error_counter.add(1, attrs)
            except Exception:
                pass
            record_span_error("checkout_failed", reason, attrs)
            try:
                checkout_duration_histogram.record(
                    (time.monotonic() - start_time) * 1000.0,
                    {"status": "failed", "reason": reason},
                )
            except Exception:
                pass

        def _record_success(order_id: Optional[int] = None, idempotent: bool = False):
            attrs = dict(base_attrs)
            attrs["idempotent"] = bool(idempotent)
            if order_id is not None:
                attrs["order_id"] = int(order_id)

            try:
                checkout_completed_counter.add(1, attrs)
            except Exception:
                pass
            try:
                if not idempotent and order_id is not None:
                    order_created_counter.add(1, {"endpoint": "orders.create_from_cart"})
            except Exception:
                pass
            add_span_event("checkout.completed", {"order_id": order_id, "idempotent": idempotent})
            if order_id is not None:
                set_span_attributes({"order.id": int(order_id)})
            try:
                checkout_duration_histogram.record(
                    (time.monotonic() - start_time) * 1000.0,
                    {"status": "success"},
                )
            except Exception:
                pass

        # Check for idempotency key
        idempotency_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
        
        if idempotency_key:
            # Check if order with this idempotency key already exists
            existing_order = Order.objects.filter(
                user=request.user,
                idempotency_key=idempotency_key
            ).first()
            
            if existing_order:
                # Return existing order (idempotent response)
                serializer = OrderSerializer(existing_order)
                _record_success(order_id=existing_order.id, idempotent=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        try:
            cart = Cart.objects.get(user=request.user)

            item_ids = request.data.get('item_ids', None)
            items_qs = cart.items.all()
            if isinstance(item_ids, list):
                if len(item_ids) == 0:
                    _record_failure("no_items_selected")
                    return Response({'error': 'No items selected'}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    normalized_ids = [int(v) for v in item_ids]
                except (TypeError, ValueError):
                    _record_failure("invalid_item_ids")
                    return Response(
                        {'error': 'Invalid item_ids', 'detail': 'item_ids must be a list of integers'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                normalized_ids = [i for i in normalized_ids if i > 0]
                if not normalized_ids:
                    _record_failure("no_items_selected")
                    return Response({'error': 'No items selected'}, status=status.HTTP_400_BAD_REQUEST)

                existing_ids = set(
                    cart.items.filter(id__in=normalized_ids).values_list('id', flat=True)
                )
                missing_ids = sorted(set(normalized_ids) - existing_ids)
                if missing_ids:
                    _record_failure("some_items_missing")
                    return Response(
                        {
                            'error': 'Some items not found in cart',
                            'missing_item_ids': missing_ids,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                items_qs = items_qs.filter(id__in=normalized_ids)

            if not items_qs.exists():
                _record_failure("cart_empty")
                return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                def parse_required_int(field_name: str) -> int:
                    raw = request.data.get(field_name, None)
                    if raw is None or raw == '':
                        raise ValueError(f"{field_name} is required")
                    try:
                        value = int(raw)
                    except (TypeError, ValueError):
                        raise ValueError(f"{field_name} must be an integer")
                    if value <= 0:
                        raise ValueError(f"{field_name} must be a positive integer")
                    return value

                def parse_money(field_name: str) -> Decimal:
                    """Parse and validate money field from request data."""
                    raw = request.data.get(field_name, 0)
                    if raw is None or raw == '':
                        raw = 0
                    try:
                        # Use the centralized validation utility
                        value = validate_money_field(raw, field_name, allow_zero=True)
                        return value
                    except (ValueError, TypeError) as e:
                        raise ValueError(f"{field_name}: {str(e)}")

                try:
                    shipping_address_id = parse_required_int('shipping_address')
                    billing_address_id = parse_required_int('billing_address')

                    if not Address.objects.filter(id=shipping_address_id, user=request.user).exists():
                        _record_failure("invalid_shipping_address")
                        return Response(
                            {
                                'error': 'Invalid checkout fields',
                                'details': {'shipping_address': ['Invalid address']},
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if not Address.objects.filter(id=billing_address_id, user=request.user).exists():
                        _record_failure("invalid_billing_address")
                        return Response(
                            {
                                'error': 'Invalid checkout fields',
                                'details': {'billing_address': ['Invalid address']},
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    shipping_cost = parse_money('shipping_cost')
                    tax = parse_money('tax')
                    discount = parse_money('discount')
                except ValueError as e:
                    field = str(e).split(' ', 1)[0]
                    _record_failure("invalid_checkout_fields", {"field": field})
                    return Response(
                        {'error': 'Invalid checkout fields', 'details': {field: [str(e)]}},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                items_qs = items_qs.select_related('product', 'variant')

                # Stock enforcement (validate + decrement inside the transaction)
                product_ids = {ci.product_id for ci in items_qs}
                variant_ids = {ci.variant_id for ci in items_qs if ci.variant_id}

                products_by_id = {
                    p.id: p
                    for p in Product.objects.select_for_update().filter(id__in=product_ids)
                }
                variants_by_id = {
                    v.id: v
                    for v in ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
                }

                stock_errors = []
                for cart_item in items_qs:
                    quantity = int(cart_item.quantity or 0)
                    if quantity <= 0:
                        stock_errors.append(
                            {
                                'cart_item_id': cart_item.id,
                                'reason': 'invalid_quantity',
                            }
                        )
                        continue

                    if cart_item.variant_id:
                        variant = variants_by_id.get(cart_item.variant_id)
                        if not variant:
                            stock_errors.append(
                                {
                                    'cart_item_id': cart_item.id,
                                    'variant_id': cart_item.variant_id,
                                    'reason': 'variant_not_found',
                                }
                            )
                            continue
                        available = int(variant.stock or 0)
                        if quantity > available:
                            # Log insufficient stock
                            log_stock_insufficient(
                                user_id=request.user.id,
                                product_id=cart_item.product_id,
                                variant_id=cart_item.variant_id,
                                requested=quantity,
                                available=available
                            )
                            stock_errors.append(
                                {
                                    'cart_item_id': cart_item.id,
                                    'product_id': cart_item.product_id,
                                    'variant_id': cart_item.variant_id,
                                    'available': available,
                                    'requested': quantity,
                                    'reason': 'insufficient_stock',
                                }
                            )
                    else:
                        product = products_by_id.get(cart_item.product_id)
                        if not product:
                            stock_errors.append(
                                {
                                    'cart_item_id': cart_item.id,
                                    'product_id': cart_item.product_id,
                                    'reason': 'product_not_found',
                                }
                            )
                            continue
                        available = int(product.stock or 0)
                        if quantity > available:
                            # Log insufficient stock
                            log_stock_insufficient(
                                user_id=request.user.id,
                                product_id=cart_item.product_id,
                                variant_id=None,
                                requested=quantity,
                                available=available
                            )
                            stock_errors.append(
                                {
                                    'cart_item_id': cart_item.id,
                                    'product_id': cart_item.product_id,
                                    'available': available,
                                    'requested': quantity,
                                    'reason': 'insufficient_stock',
                                }
                            )

                if stock_errors:
                    # Log overall checkout failure
                    log_checkout_failure(
                        user_id=request.user.id,
                        error_type='insufficient_stock',
                        error_message='One or more items have insufficient stock',
                        context={'stock_errors': stock_errors}
                    )
                    return Response(
                        {
                            'error': 'Insufficient stock',
                            'details': stock_errors,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                for cart_item in items_qs:
                    quantity = int(cart_item.quantity)
                    if cart_item.variant_id:
                        variant = variants_by_id[cart_item.variant_id]
                        variant.stock = int(variant.stock) - quantity
                        variant.save(update_fields=['stock'])
                    else:
                        product = products_by_id[cart_item.product_id]
                        product.stock = int(product.stock) - quantity
                        product.save(update_fields=['stock'])

                subtotal = sum((i.subtotal for i in items_qs), Decimal('0'))
                if discount > (subtotal + shipping_cost + tax):
                    _record_failure("discount_exceeds_total")
                    return Response(
                        {
                            'error': 'Invalid pricing',
                            'details': {
                                'discount': ['discount cannot exceed subtotal + shipping_cost + tax']
                            },
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Compute total server-side with proper rounding (never trust client)
                total = round_currency(subtotal + shipping_cost + tax - discount)
                if total < 0:
                    _record_failure("negative_total")
                    return Response(
                        {
                            'error': 'Invalid pricing',
                            'details': {'total': ['total cannot be negative']},
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create order
                order = Order.objects.create(
                    user=request.user,
                    shipping_address_id=shipping_address_id,
                    billing_address_id=billing_address_id,
                    subtotal=subtotal,
                    shipping_cost=shipping_cost,
                    tax=tax,
                    discount=discount,
                    total=total,
                    notes=request.data.get('notes', ''),
                    idempotency_key=idempotency_key  # Save idempotency key
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
            _record_success(order_id=order.id, idempotent=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Cart.DoesNotExist:
            _record_failure("cart_not_found")
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        """Update order status (admin only)."""
        order = self.get_object()
        new_status = request.data.get('status', '').strip().lower()
        notes = request.data.get('notes', '')
        
        valid_statuses = dict(Order.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status == order.status:
            return Response(
                {'error': 'Order is already in this status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = order.status
        order.status = new_status
        order.save()
        
        # Log status change
        log_order_status_change(
            user_id=order.user_id,
            order_id=order.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user.id
        )
        
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            notes=notes or f'Status changed from {old_status} to {new_status}'
        )
        
        # Update associated payment status based on order status
        if new_status == 'confirmed' and order.payments.exists():
            order.payments.update(status='completed')
        elif new_status == 'cancelled' and order.payments.filter(status='pending').exists():
            order.payments.filter(status='pending').update(status='cancelled')
        elif new_status == 'refunded' and order.payments.exists():
            order.payments.update(status='refunded')
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
