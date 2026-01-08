"""Baggage helpers for cross-service context propagation.

Baggage is useful for propagating lightweight key/value context across services.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Optional

from opentelemetry import baggage
from opentelemetry.context import attach, detach, get_current


def set_baggage_value(key: str, value: str) -> None:
    """Set a baggage value on the current context."""
    ctx = baggage.set_baggage(key, value, context=get_current())
    token = attach(ctx)
    # Immediately detach; the context remains current only for this scope.
    # Callers should use the context manager helpers for request-scoped baggage.
    detach(token)


def get_baggage_value(key: str) -> Optional[str]:
    return baggage.get_baggage(key)


@contextmanager
def baggage_context(values: dict[str, str]):
    """Attach multiple baggage values for the duration of the context."""
    ctx = get_current()
    for key, value in values.items():
        ctx = baggage.set_baggage(key, value, context=ctx)

    token = attach(ctx)
    try:
        yield
    finally:
        detach(token)
