from rest_framework import permissions, serializers
from django.db.models import Q
from django.contrib.auth.models import Permission
from iaso.models import Account, Profile
from .common import ModelViewSet, HasPermission
from hat.menupermissions import models as permission
from hat.menupermissions.constants import MODULE_PERMISSIONS, MODULES


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
        return PermissionSerializer(Permission.objects.filter(codename__in=obj["permissions"]), many=True).data

    def get_account(self, obj):
        user = self.context["request"].user
        profile = Profile.objects.filter(user=user)
        if profile:
            account = profile.first().account
            account_serializer = []
            if obj["codename"] in account.modules:
                account_serializer = [account]
            else:
                account_serializer = []

            return AccountSerializer(account_serializer, many=True).data
        else:
            return []


class ModulesViewSet(ModelViewSet):
    f"""Modules API

    This API is restricted to authenticated users having the "{permission.MODULES}" permission for reading only

    GET /api/modules/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.MODULES)]  # type: ignore
    serializer_class = ModuleSerializer
    http_method_names = ["get"]

    def get_queryset(self):
        queryset = []
        for module in MODULES:
            permissions = MODULE_PERMISSIONS[module["codename"]]
            name = module["name"]
            codename = module["codename"]
            queryset.append({"name": name, "codename": codename, "permissions": permissions})
        search = self.request.GET.get("search", None)
        # orders = self.request.GET.get("order", "name").split(",")
        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        # if orders:
        # queryset = queryset.order_by(*orders)
        return queryset
