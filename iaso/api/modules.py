from django.contrib.auth.models import Permission
from rest_framework import permissions, serializers

from hat.menupermissions import models as permission
from hat.menupermissions.constants import MODULE_PERMISSIONS, MODULES
from iaso.models import Account, Profile

from .common import ModelViewSet


class HasModulesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if (not request.user.has_perm(permission.MODULES)) and request.method != "GET":
            return False
        return True


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "name", "codename")


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ("id", "name")


class ModuleSerializer(serializers.Serializer):
    name = serializers.CharField()
    codename = serializers.CharField()
    fr_name = serializers.CharField()
    es_name = serializers.CharField()
    permissions = serializers.SerializerMethodField("get_permissions")
    account = serializers.SerializerMethodField("get_account")

    class Meta:
        fields = ["name", "codename", "fr_name", "es_name", "permissions", "account"]

    def get_permissions(self, obj):
        return PermissionSerializer(Permission.objects.filter(codename__in=obj["permissions"]), many=True).data

    def get_account(self, obj):
        user = self.context["request"].user
        profile = Profile.objects.filter(user=user)
        if profile:
            account = profile.first().account
            account_modules = account.modules if account.modules else []
            account_serializer = []
            if obj["codename"] in account_modules:
                account_serializer = [account]
            else:
                account_serializer = []

            return AccountSerializer(account_serializer, many=True).data
        return []


class ModulesViewSet(ModelViewSet):
    f"""Modules API

    This API is restricted to authenticated users having the "{permission.MODULES}" permission for reading only

    GET /api/modules/
    """

    permission_classes = [permissions.IsAuthenticated, HasModulesPermission]  # type: ignore
    serializer_class = ModuleSerializer
    http_method_names = ["get"]

    def get_queryset(self):
        queryset = []
        for module in MODULES:
            permissions = MODULE_PERMISSIONS.get(module["codename"], [])
            name = module["name"]
            codename = module["codename"]
            fr_name = module["fr_name"]
            es_name = module.get("es_name", name)  # Fallback to English name if Spanish not available
            queryset.append(
                {"name": name, "codename": codename, "permissions": permissions, "fr_name": fr_name, "es_name": es_name}
            )
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "name").split(",")

        if search:
            queryset = [
                module
                for module in queryset
                if search.lower() in module["name"].lower()
                or search.lower() in module["fr_name"].lower()
                or search.lower() in module["es_name"].lower()
            ]
        if orders:
            order_key = ("").join(orders)
            if "-" in order_key:
                queryset = sorted(queryset, key=lambda module: module[order_key.replace("-", "")].lower(), reverse=True)
            else:
                queryset = sorted(queryset, key=lambda module: module[order_key].lower())
        return queryset
