from django.conf import settings
from rest_framework.permissions import BasePermission


class IsTestModeEnabled(BasePermission):
    def has_permission(self, request, view):
        return getattr(settings, "TEST_MODE", False)
