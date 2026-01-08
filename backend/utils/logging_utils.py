"""Structured logging utilities for critical operations."""
import logging
import json
from typing import Any, Dict, Optional

from opentelemetry import trace

logger = logging.getLogger('ecommerce')


def _get_trace_context() -> Dict[str, Optional[str]]:
    span = trace.get_current_span()
    ctx = span.get_span_context() if span is not None else None
    if ctx is None or not getattr(ctx, "is_valid", False):
        return {"trace_id": None, "span_id": None}
    return {
        "trace_id": f"{ctx.trace_id:032x}",
        "span_id": f"{ctx.span_id:016x}",
    }


def log_checkout_failure(
    user_id: int,
    error_type: str,
    error_message: str,
    context: Optional[Dict[str, Any]] = None
):
    """Log checkout failure with structured context."""
    log_data = {
        'event': 'checkout_failure',
        'user_id': user_id,
        'error_type': error_type,
        'error_message': error_message,
        'context': context or {},
        'trace': _get_trace_context(),
    }
    logger.error(f"Checkout failure: {json.dumps(log_data)}")


def log_payment_failure(
    user_id: int,
    order_id: Optional[int],
    payment_id: Optional[int],
    error_type: str,
    error_message: str,
    context: Optional[Dict[str, Any]] = None
):
    """Log payment failure with structured context."""
    log_data = {
        'event': 'payment_failure',
        'user_id': user_id,
        'order_id': order_id,
        'payment_id': payment_id,
        'error_type': error_type,
        'error_message': error_message,
        'context': context or {},
        'trace': _get_trace_context(),
    }
    logger.error(f"Payment failure: {json.dumps(log_data)}")


def log_stock_insufficient(
    user_id: int,
    product_id: int,
    variant_id: Optional[int],
    requested: int,
    available: int
):
    """Log insufficient stock error."""
    log_data = {
        'event': 'stock_insufficient',
        'user_id': user_id,
        'product_id': product_id,
        'variant_id': variant_id,
        'requested_quantity': requested,
        'available_quantity': available,
        'trace': _get_trace_context(),
    }
    logger.warning(f"Insufficient stock: {json.dumps(log_data)}")


def log_order_status_change(
    user_id: int,
    order_id: int,
    old_status: str,
    new_status: str,
    changed_by: int
):
    """Log order status change."""
    log_data = {
        'event': 'order_status_change',
        'user_id': user_id,
        'order_id': order_id,
        'old_status': old_status,
        'new_status': new_status,
        'changed_by_user_id': changed_by,
        'trace': _get_trace_context(),
    }
    logger.info(f"Order status change: {json.dumps(log_data)}")


def log_payment_status_change(
    user_id: int,
    order_id: int,
    payment_id: int,
    old_status: str,
    new_status: str
):
    """Log payment status change."""
    log_data = {
        'event': 'payment_status_change',
        'user_id': user_id,
        'order_id': order_id,
        'payment_id': payment_id,
        'old_status': old_status,
        'new_status': new_status,
        'trace': _get_trace_context(),
    }
    logger.info(f"Payment status change: {json.dumps(log_data)}")
