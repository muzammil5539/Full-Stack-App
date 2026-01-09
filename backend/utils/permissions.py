"""
Custom permissions for the e-commerce application.
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users
        return request.user and request.user.is_staff


class IsStaffOrInAdminGroup(permissions.BasePermission):
    """
    Allow write access to users who are staff or who belong to
    the dedicated admin group (default: 'admin_portal'). Safe
    methods remain open to any request.
    """

    ADMIN_GROUP_NAME = 'admin_portal'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        if user.is_staff:
            return True

        return user.groups.filter(name=self.ADMIN_GROUP_NAME).exists()


class IsStaffOrInAdminGroupStrict(permissions.BasePermission):
    """
    Strict variant: require the user to be staff or in the admin group
    for all methods (no public safe-method access).
    """

    ADMIN_GROUP_NAME = 'admin_portal'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        if user.is_staff:
            return True

        return user.groups.filter(name=self.ADMIN_GROUP_NAME).exists()
