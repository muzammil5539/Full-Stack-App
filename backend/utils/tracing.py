"""
Custom span utilities for business operations.

This module provides decorators and context managers for adding
custom spans to critical business operations like checkout and payments.
"""
import time
from functools import wraps
from typing import Callable, Any, Optional
from contextlib import contextmanager

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from utils.telemetry import (
    get_tracer,
    checkout_started_counter,
    checkout_completed_counter,
    checkout_failed_counter,
    checkout_duration_histogram,
    order_created_counter,
    payment_success_counter,
    payment_failed_counter,
    payment_duration_histogram,
)


tracer = get_tracer("django.ecommerce.business.spans")


def trace_checkout_operation(func: Callable) -> Callable:
    """
    Decorator to trace checkout operations with custom spans and metrics.
    
    Usage:
        @trace_checkout_operation
        def create_order_from_cart(user, cart_items):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        with tracer.start_as_current_span(
            f"checkout.{func.__name__}",
            attributes={
                "operation.type": "checkout",
                "operation.name": func.__name__,
            }
        ) as span:
            start_time = time.time()
            checkout_started_counter.add(1, {"operation": func.__name__})
            
            try:
                # Execute the actual function
                result = func(*args, **kwargs)
                
                # Record success
                duration_ms = (time.time() - start_time) * 1000
                checkout_completed_counter.add(1, {"operation": func.__name__})
                checkout_duration_histogram.record(duration_ms, {"operation": func.__name__, "status": "success"})
                
                span.set_status(Status(StatusCode.OK))
                span.set_attribute("checkout.success", True)
                
                # Add business entity attributes if available
                if hasattr(result, 'id'):
                    span.set_attribute("order.id", str(result.id))
                if hasattr(result, 'user_id'):
                    span.set_attribute("user.id", str(result.user_id))
                
                return result
                
            except Exception as e:
                # Record failure
                duration_ms = (time.time() - start_time) * 1000
                checkout_failed_counter.add(1, {
                    "operation": func.__name__,
                    "error_type": type(e).__name__
                })
                checkout_duration_histogram.record(duration_ms, {"operation": func.__name__, "status": "error"})
                
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.set_attribute("checkout.success", False)
                span.set_attribute("error.type", type(e).__name__)
                span.set_attribute("error.message", str(e))
                span.record_exception(e)
                
                raise
    
    return wrapper


def trace_payment_operation(func: Callable) -> Callable:
    """
    Decorator to trace payment operations with custom spans and metrics.
    
    Usage:
        @trace_payment_operation
        def process_payment(order, payment_method):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        with tracer.start_as_current_span(
            f"payment.{func.__name__}",
            attributes={
                "operation.type": "payment",
                "operation.name": func.__name__,
            }
        ) as span:
            start_time = time.time()
            
            try:
                # Execute the actual function
                result = func(*args, **kwargs)
                
                # Record success
                duration_ms = (time.time() - start_time) * 1000
                payment_success_counter.add(1, {"operation": func.__name__})
                payment_duration_histogram.record(duration_ms, {"operation": func.__name__, "status": "success"})
                
                span.set_status(Status(StatusCode.OK))
                span.set_attribute("payment.success", True)
                
                # Add business entity attributes if available
                if hasattr(result, 'id'):
                    span.set_attribute("payment.id", str(result.id))
                if hasattr(result, 'order_id'):
                    span.set_attribute("order.id", str(result.order_id))
                if hasattr(result, 'payment_method'):
                    span.set_attribute("payment.method", result.payment_method)
                if hasattr(result, 'amount'):
                    span.set_attribute("payment.amount", str(result.amount))
                
                return result
                
            except Exception as e:
                # Record failure
                duration_ms = (time.time() - start_time) * 1000
                payment_failed_counter.add(1, {
                    "operation": func.__name__,
                    "error_type": type(e).__name__
                })
                payment_duration_histogram.record(duration_ms, {"operation": func.__name__, "status": "error"})
                
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.set_attribute("payment.success", False)
                span.set_attribute("error.type", type(e).__name__)
                span.set_attribute("error.message", str(e))
                span.record_exception(e)
                
                raise
    
    return wrapper


@contextmanager
def trace_operation(operation_name: str, attributes: Optional[dict] = None):
    """
    Context manager for tracing arbitrary operations.
    
    Usage:
        with trace_operation("validate_stock", {"product_id": product.id}):
            # Your operation code here
            pass
    """
    with tracer.start_as_current_span(
        operation_name,
        attributes=attributes or {}
    ) as span:
        try:
            yield span
            span.set_status(Status(StatusCode.OK))
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.set_attribute("error.type", type(e).__name__)
            span.set_attribute("error.message", str(e))
            span.record_exception(e)
            raise


def add_order_created_event(order):
    """Record order creation event with metrics."""
    order_created_counter.add(1, {
        "order_status": order.status,
        "payment_status": order.payment_status,
    })
    
    # Add span event if within an active span
    current_span = trace.get_current_span()
    if current_span.is_recording():
        current_span.add_event(
            "order.created",
            attributes={
                "order.id": str(order.id),
                "order.status": order.status,
                "order.total": str(order.total),
                "user.id": str(order.user_id),
            }
        )


def add_span_attributes(attributes: dict):
    """Add attributes to the current span if one is active."""
    current_span = trace.get_current_span()
    if current_span.is_recording():
        for key, value in attributes.items():
            current_span.set_attribute(key, str(value) if value is not None else "null")


def add_span_event(event_name: str, attributes: Optional[dict] = None):
    """Add an event to the current span if one is active."""
    current_span = trace.get_current_span()
    if current_span.is_recording():
        current_span.add_event(event_name, attributes=attributes or {})
