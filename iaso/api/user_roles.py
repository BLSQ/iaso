from typing import Any
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from rest_framework import permissions, serializers
from django.contrib.auth.models import Permission, Group
from django.db.models import Q, QuerySet
from rest_framework.response import Response
from iaso.models import UserRole
from .common import TimestampField, ModelViewSet, HasPermission


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

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_permissions(self, obj):
        return PermissionSerializer(obj.group.permissions, many=True).data

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        request = self.context["request"]
        groupname = request.data.get("name")
        permissions = request.data.get("permissions", [])
        if not groupname:
            return Response({"error": "User group name is required"}, status=400)

        group = Group(name=groupname)
        group.save()

        if group.id and len(permissions) > 0:
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename=permission_codename)
                group.permissions.add(permission)
            group.save()

        userRole = UserRole.objects.create(group=group, account=account)
        userRole.save()
        return userRole

    def update(self, user_role, validated_data):
        groupname = self.context["request"].data.get("name", None)
        permissions = self.context["request"].data.get("permissions", None)
        group = user_role.group
        if groupname is not None:
            group.name = groupname
        if permissions is not None:
            group.permissions.clear()
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename=permission_codename)
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

    # FIXME : replace by a model viewset

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_user_roles")]
    serializer_class = UserRoleSerializer
    http_method_names = ["get", "post", "put", "delete"]

    def get_queryset(self) -> QuerySet[UserRole]:
        account = self.request.user.iaso_profile.account
        queryset = UserRole.objects.filter(account=account)
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "group__name").split(",")
        if search:
            queryset = queryset.filter(Q(group__name__icontains=search)).distinct()
        if orders:
            queryset = queryset.order_by(*orders)

        return queryset
