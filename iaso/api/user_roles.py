from django.contrib.auth.models import Group, Permission
from django.db.models import Q, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers, status
from rest_framework.response import Response

from iaso.models import OrgUnitType, Project, UserRole
from iaso.permissions.core_permissions import CORE_USERS_ROLES_PERMISSION

from .common import ModelViewSet, TimestampField


class HasUserRolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if (not request.user.has_perm(CORE_USERS_ROLES_PERMISSION.full_name())) and request.method != "GET":
            return False
        return True


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "name", "codename")


class UserRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField("get_permissions")
    name = serializers.CharField(source="group.name")
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    editable_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="editable_org_unit_types",
        queryset=OrgUnitType.objects.all(),
        required=False,
        allow_null=True,
        many=True,
    )

    class Meta:
        model = UserRole
        fields = ["id", "name", "permissions", "editable_org_unit_type_ids", "created_at", "updated_at"]

    def to_representation(self, instance):
        user_role = super().to_representation(instance)
        account_id = user_role["name"].split("_")[0]
        user_role["name"] = user_role["name"].removeprefix(f"{account_id}_")
        return user_role

    def get_permissions(self, obj):
        return [permission["codename"] for permission in PermissionSerializer(obj.group.permissions, many=True).data]

    def create(self, validated_data):
        request = self.context["request"]
        account = request.user.iaso_profile.account
        group_name = str(account.id) + "_" + request.data.get("name")
        permissions = request.data.get("permissions", [])
        editable_org_unit_types = validated_data.get("editable_org_unit_types", [])

        # check if a user role with the same name already exists
        if Group.objects.filter(name__iexact=group_name).exists():
            raise serializers.ValidationError({"name": "User role already exists"})

        group = Group(name=group_name)
        group.save()

        if group.id and len(permissions) > 0:
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename__startswith="iaso_", codename=permission_codename)
                group.permissions.add(permission)
            group.save()

        user_role = UserRole.objects.create(group=group, account=account)
        user_role.save()
        user_role.editable_org_unit_types.set(editable_org_unit_types)
        return user_role

    def update(self, user_role, validated_data):
        request = self.context["request"]
        account = request.user.iaso_profile.account
        group = user_role.group
        group_name = str(account.id) + "_" + validated_data.get("group", {}).get("name")
        permissions = request.data.get("permissions", None)
        editable_org_unit_types = validated_data.get("editable_org_unit_types", [])

        if Group.objects.filter(~Q(pk=group.id), name__iexact=group_name).exists():
            raise serializers.ValidationError({"name": "User role already exists"})

        if permissions is not None:
            group.permissions.clear()
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename__startswith="iaso_", codename=permission_codename)
                group.permissions.add(permission)

        group.save()
        user_role.save()
        user_role.editable_org_unit_types.set(editable_org_unit_types)
        return user_role

    def validate_editable_org_unit_type_ids(self, editable_org_unit_types) -> QuerySet[OrgUnitType]:
        account = self.context.get("request").user.iaso_profile.account
        project_org_unit_types = set(Project.objects.filter(account=account).values_list("unit_types__id", flat=True))
        for org_unit_type in editable_org_unit_types:
            if org_unit_type.pk not in project_org_unit_types:
                raise serializers.ValidationError(
                    f"`{org_unit_type.name} ({org_unit_type.pk})` is not a valid Org Unit Type for this account."
                )
        return editable_org_unit_types


class UserRolesViewSet(ModelViewSet):
    f"""Roles API

    This API is restricted to authenticated users having the "{CORE_USERS_ROLES_PERMISSION}" permission for write permission
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
        queryset = UserRole.objects.filter(account=user.iaso_profile.account).prefetch_related(
            "group__permissions", "editable_org_unit_types"
        )
        search = self.request.GET.get("search", None)
        orders = self.request.GET.get("order", "group__name").split(",")
        if search:
            queryset = queryset.filter(Q(group__name__icontains=search)).distinct()
        if orders:
            queryset = queryset.order_by(*orders)

        return queryset

    def perform_destroy(self, user_role):
        group = user_role.group
        users_in_group = group.user_set.all()
        # remove the group form all users in it
        for user in users_in_group:
            user.groups.remove(group)
        # delete the group
        group.delete()
        # delete the user role
        super().perform_destroy(user_role)

        return Response(status=status.HTTP_204_NO_CONTENT)
