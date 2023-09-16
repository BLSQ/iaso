from rest_framework import permissions, serializers
from django.db.models import Q, QuerySet
from django.contrib.auth.models import Permission
from iaso.models import Account, Module
from .common import ModelViewSet, HasPermission
from hat.menupermissions import models as permission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "name", "codename")


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ("id", "name")


class ModuleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField("get_permissions")
    account = serializers.SerializerMethodField("get_account")

    class Meta:
        model = Module
        fields = ["name", "permissions", "account"]

    def get_permissions(self, obj):
        return PermissionSerializer(Permission.objects.filter(permission__module=obj), many=True).data

    def get_account(self, obj):
        account = self.context["request"].user.iaso_profile.account
        return AccountSerializer(obj.account_modules.filter(pk=account.id), many=True).data


class ModulesViewSet(ModelViewSet):
    f"""Modules API

    This API is restricted to authenticated users having the "{permission.MODULES}" permission for reading only

    GET /api/modules/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.MODULES)]  # type: ignore
    serializer_class = ModuleSerializer
    http_method_names = ["get"]

    def get_queryset(self) -> QuerySet[Module]:
        queryset = Module.objects.all()  # type: ignore
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "name").split(",")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        if orders:
            queryset = queryset.order_by(*orders)

        return queryset
