from rest_framework import permissions

import iaso.permissions as core_permissions


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
        return request.user.is_authenticated and request.user.has_perm(core_permissions.STOCK_MANAGEMENT)

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "account"):
            account = obj.account
        else:
            account = obj.sku.account
        return account == request.user.iaso_profile.account
