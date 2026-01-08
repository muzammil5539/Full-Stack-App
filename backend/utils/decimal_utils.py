"""Decimal validation and rounding utilities for currency handling."""
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Union


def validate_currency_decimal(value: Union[str, int, float, Decimal], field_name: str = 'value') -> Decimal:
    """
    Validate and convert a value to a properly formatted currency Decimal.
    
    Args:
        value: The value to validate and convert
        field_name: The name of the field (for error messages)
    
    Returns:
        Decimal: Properly rounded currency decimal (2 decimal places)
    
    Raises:
        ValueError: If the value cannot be converted or is invalid
    """
    if value is None or value == '':
        raise ValueError(f'{field_name}: Value is required')
    
    try:
        decimal_value = Decimal(str(value))
    except (ValueError, InvalidOperation, TypeError):
        raise ValueError(f'{field_name}: Invalid decimal value')
    
    if decimal_value < 0:
        raise ValueError(f'{field_name}: Value cannot be negative')
    
    # Round to 2 decimal places (currency precision)
    return decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def validate_money_field(value: Union[str, int, float, Decimal], field_name: str = 'value', 
                         allow_zero: bool = True, max_value: Decimal = None) -> Decimal:
    """
    Validate a money field with optional constraints.
    
    Args:
        value: The value to validate
        field_name: The name of the field (for error messages)
        allow_zero: Whether to allow zero values
        max_value: Optional maximum value
    
    Returns:
        Decimal: Validated and rounded currency decimal
    
    Raises:
        ValueError: If validation fails
    """
    decimal_value = validate_currency_decimal(value, field_name)
    
    if not allow_zero and decimal_value == 0:
        raise ValueError(f'{field_name}: Value must be greater than zero')
    
    if max_value is not None and decimal_value > max_value:
        raise ValueError(f'{field_name}: Value cannot exceed {max_value}')
    
    return decimal_value


def round_currency(value: Decimal) -> Decimal:
    """
    Round a Decimal to currency precision (2 decimal places).
    
    Args:
        value: The Decimal value to round
    
    Returns:
        Decimal: Rounded value
    """
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_total(amounts: list) -> Decimal:
    """
    Calculate total from a list of amounts with proper rounding.
    
    Args:
        amounts: List of Decimal amounts to sum
    
    Returns:
        Decimal: Total amount rounded to currency precision
    """
    if not amounts:
        return Decimal('0.00')
    total = sum(amounts)
    return round_currency(total)
