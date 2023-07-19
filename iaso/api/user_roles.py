from typing import Any
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers
from django.contrib.auth.models import Permission, Group
from django.db.models import Q, QuerySet
from rest_framework.response import Response
from iaso.models import UserRole
from .common import TimestampField, ModelViewSet


class HasUserRolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if (not request.user.has_perm("menupermissions.iaso_user_roles")) and request.method != "GET":
            return False
        return True


class HasUserRolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if (not request.user.has_perm("menupermissions.iaso_user_roles")) and request.method != "GET":
            return False
        return True


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "name", "codename")


class UserRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField("get_permissions")
    name = serializers.CharField(source="group.name")

    class Meta:
        model = UserRole
        fields = ["id", "name", "permissions", "created_at", "updated_at"]

    def to_representation(self, instance):
        user_role = super().to_representation(instance)
        account_id = user_role["name"].split("_")[0]
        user_role["name"] = self.remove_prefix_from_str(user_role["name"], account_id + "_")
        return user_role

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    # This method will remove a given prefix from a string
    def remove_prefix_from_str(self, str, prefix):
        if str.startswith(prefix):
            return str[len(prefix) :]
        return str

    def get_permissions(self, obj):
        return PermissionSerializer(obj.group.permissions, many=True).data

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        request = self.context["request"]
        group_name = str(account.id) + "_" + request.data.get("name")
        permissions = request.data.get("permissions", [])

        # check if the user role name has been given
        if not group_name:
            raise serializers.ValidationError({"name": "User role name is required"})

        # check if a user role with the same name already exists
        group_exists = Group.objects.filter(name__iexact=group_name)
        if group_exists:
            raise serializers.ValidationError({"name": "User role already exists"})

        group = Group(name=group_name)
        group.save()

        if group.id and len(permissions) > 0:
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename__startswith="iaso_", codename=permission_codename)
                group.permissions.add(permission)
            group.save()

        userRole = UserRole.objects.create(group=group, account=account)
        userRole.save()
        return userRole

    def update(self, user_role, validated_data):
        account = self.context["request"].user.iaso_profile.account
        group_name = str(account.id) + "_" + self.context["request"].data.get("name", None)
        permissions = self.context["request"].data.get("permissions", None)
        group = user_role.group

        if group_name is not None:
            group.name = group_name
        # check if a user role with the same name already exists other than the current user role
        group_exists = Group.objects.filter(~Q(pk=group.id), name__iexact=group_name)
        if group_exists:
            raise serializers.ValidationError({"name": "User role already exists"})

        if permissions is not None:
            group.permissions.clear()
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename__startswith="iaso_", codename=permission_codename)
                group.permissions.add(permission)

        group.save()
        user_role.save()
        return user_role


class UserRolesViewSet(ModelViewSet):
    """Roles API

    This API is restricted to authenticated users having the "menupermissions.iaso_user_roles" permission for write permission
    Read access is accessible to any authenticated users as it necessary to list roles or display a particular one in
    the interface.

    GET /api/userroles/
    GET /api/userroles/<id>
    UPDATE /api/userroles/<id>
    DELETE /api/userroles/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasUserRolePermission]  # type: ignore
    serializer_class = UserRoleSerializer
    http_method_names = ["get", "post", "put", "delete"]

    def get_queryset(self) -> QuerySet[UserRole]:
        user = self.request.user
        queryset = UserRole.objects.filter(account=user.iaso_profile.account)  # type: ignore
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "group__name").split(",")
        if search:
            queryset = queryset.filter(Q(group__name__icontains=search)).distinct()
        if orders:
            queryset = queryset.order_by(*orders)

        return queryset
