"""
Custom mixins for views.
"""

from rest_framework import status
from rest_framework.response import Response


class CustomResponseMixin:
    """
    Mixin to provide custom response formatting.
    """

    def success_response(self, data=None, message='Success', status_code=status.HTTP_200_OK):
        """Return success response."""
        return Response({
            'success': True,
            'message': message,
            'data': data
        }, status=status_code)

    def error_response(self, message='Error', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return error response."""
        return Response({
            'success': False,
            'message': message,
            'errors': errors
        }, status=status_code)
