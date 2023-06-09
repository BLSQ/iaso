from typing import Any
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from rest_framework import viewsets, permissions, serializers
from django.contrib.auth.models import Permission, Group
from django.db.models import Q, QuerySet
from rest_framework.response import Response
from iaso.models import UserRole
from django.core.paginator import Paginator
from .common import TimestampField, ModelViewSet


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "name", "codename")


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("id", "name", "permissions")

    permissions = PermissionSerializer(many=True, read_only=True)


class UserRoleSerializer(serializers.ModelSerializer):
    group = GroupSerializer()

    class Meta:
        model = UserRole
        fields = ["id", "group", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class HasRolesPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view) -> bool:
        if not request.user.has_perm("menupermissions.iaso_user_roles"):
            return False
        return True


class UserRolesViewSet(ModelViewSet):
    """Roles API

    This API is restricted to authenticated users having the "menupermissions.iaso_user_roles" permission for write permission
    Read access is accessible to any authenticated users as it necessary to list roles or display a particular one in
    the interface.

    GET /api/roles/
    GET /api/roles/<id>
    PATCH /api/roles/<id>
    DELETE /api/roles/<id>
    """

    # FIXME : replace by a model viewset

    permission_classes = [permissions.IsAuthenticated, HasRolesPermission]
    serializer_class = UserRoleSerializer

    def get_queryset(self) -> QuerySet[UserRole]:
        queryset = UserRole.objects.all()
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "group__name").split(",")
        if search:
            queryset = queryset.filter(Q(group__name__icontains=search)).distinct()
        if orders:
            queryset = queryset.order_by(*orders)

        return queryset

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        pk = kwargs.get("pk")
        userRole = get_object_or_404(self.get_queryset(), pk=pk)
        return Response(userRole.as_dict())

    def partial_update(self, request: Request, pk: int = None) -> Response:
        userRole = get_object_or_404(self.get_queryset(), id=pk)
        group = userRole.group

        name = request.data.get("name", None)
        permissions = request.data.get("permissions", [])
        modified = False

        if name:
            group.name = name
            modified = True

        if len(permissions) > 0:
            group.permissions.clear()
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename=permission_codename)
                group.permissions.add(permission)
            modified = True

        if modified:
            group.save()
            userRole.save()
            return Response(userRole.as_dict())
        else:
            return Response({})

    def delete(self, request: Request, pk: int = None) -> Response:
        userRole = get_object_or_404(self.get_queryset(), id=pk)
        userRole.delete()
        return Response(True)

    def create(self, request: Request) -> Response:
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

        userRole = UserRole()
        userRole.group = group

        userRole.save()

        return Response(userRole.as_dict())
