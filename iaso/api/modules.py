from django.contrib.auth.models import Permission
from rest_framework import permissions, serializers

from iaso.models import Account, Profile
from iaso.modules import MODULES
from iaso.permissions.core_permissions import CORE_MODULES_PERMISSION

from .common import ModelViewSet


class HasModulesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if (not request.user.has_perm(CORE_MODULES_PERMISSION.full_name())) and request.method != "GET":
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
    permissions = serializers.SerializerMethodField("get_permissions")
    account = serializers.SerializerMethodField("get_account")

    class Meta:
        fields = ["name", "codename", "permissions", "account"]

    def get_permissions(self, obj):
        codenames = [p.codename for p in obj.permissions]
        return PermissionSerializer(Permission.objects.filter(codename__in=codenames), many=True).data

    def get_account(self, obj):
        user = self.context["request"].user
        profile = Profile.objects.filter(user=user)
        if profile:
            account = profile.first().account
            account_modules = account.modules if account.modules else []
            account_serializer = []
            if obj.codename in account_modules:
                account_serializer = [account]

            return AccountSerializer(account_serializer, many=True).data
        return []


class ModulesViewSet(ModelViewSet):
    f"""Modules API

    This API is restricted to authenticated users having the "{CORE_MODULES_PERMISSION}" permission for reading only

    GET /api/modules/
    """

    permission_classes = [permissions.IsAuthenticated, HasModulesPermission]  # type: ignore
    serializer_class = ModuleSerializer
    http_method_names = ["get"]

    def get_queryset(self):
        queryset = MODULES
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "name").split(",")

        if search:
            queryset = [
                module
                for module in queryset
                if search.lower() in module.name.lower() or search.lower() in module.fr_name.lower()
            ]
        if orders:
            order_key = ("").join(orders)
            if "-" in order_key:
                queryset = sorted(
                    queryset, key=lambda module: getattr(module, order_key.replace("-", "")).lower(), reverse=True
                )
            else:
                queryset = sorted(queryset, key=lambda module: getattr(module, order_key).lower())
        return queryset
