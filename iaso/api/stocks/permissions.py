from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_STOCK_MANAGEMENT


class HasStockManagementReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "account"):
            account = obj.account
        else:
            account = obj.sku.account
        return account == request.user.iaso_profile.account


class HasStockManagementFullPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and request.user.has_perm(CORE_STOCK_MANAGEMENT.full_name())

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "account"):
            account = obj.account
        else:
            account = obj.sku.account
        return account == request.user.iaso_profile.account
