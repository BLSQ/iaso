import datetime

from django.utils import timezone
from rest_framework import permissions

from plugins.polio.models.performance_dashboard import PerformanceDashboard
from plugins.polio.permissions import (
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_READ_ONLY_PERMISSION,
)


DAYS_OPEN_FOR_NON_ADMIN_EDIT = 7


class PerformanceDashboardPermission(permissions.BasePermission):
    """
    Custom permission for the Performance Dashboard.
    - Read-only users can only view data.
    - Non-admin users can create data and modify recent data.
    - Admin users have unrestricted access.
"""
    def has_permission(self, request, view):
        """
        View - level permissions.
        - Read access for safe methods if user has any of the required permissions.
        - Write access for unsafe methods if user has write or admin permissions.
        """
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user.has_perm(POLIO_PERFORMANCE_READ_ONLY_PERMISSION.full_name())
                or request.user.has_perm(POLIO_PERFORMANCE_NON_ADMIN_PERMISSION.full_name())
                or request.user.has_perm(POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name())
            )
        return request.user.has_perm(POLIO_PERFORMANCE_NON_ADMIN_PERMISSION.full_name()) or request.user.has_perm(
            POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name()
        )
    def has_object_permission(self, request, view, obj: PerformanceDashboard):
        """
        Object-level permissions, checked for retrieve, update, and delete actions.
        - Admins can do anything.
        - Read-only users can only view.
        - Non-admins can only edit/delete recent objects.
        """
        if request.user.has_perm(POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name()):
            return True
        if request.user.has_perm(POLIO_PERFORMANCE_NON_ADMIN_PERMISSION.full_name()):
            if request.method in permissions.SAFE_METHODS or request.method =="POST":
                # Read and create actions are allowed for non-admins.
                return True

            if request.method in ("PUT", "PATCH", "DELETE"):
                # Non-admins can only modify objects created within the time window.
                time_limit = timezone.now() - datetime.timedelta(days=DAYS_OPEN_FOR_NON_ADMIN_EDIT)
                return obj.created_at >= time_limit

        if request.user.has_perm(POLIO_PERFORMANCE_READ_ONLY_PERMISSION.full_name()):
            return request.method in permissions.SAFE_METHODS

        return False