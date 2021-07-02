from rest_framework import permissions, serializers
from django.db.models import Count

from iaso.models import Group
from .common import ModelViewSet, TimestampField, HasPermission


class HasGroupPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.source_version.data_source.read_only and request.method != "GET":
            return False

        user_account = request.user.iaso_profile.account
        projects = obj.source_version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "source_ref", "source_version", "org_unit_count", "created_at", "updated_at"]
        read_only_fields = ["id", "source_version", "org_unit_count", "created_at", "updated_at"]

    source_version = serializers.SerializerMethodField(read_only=True)  # TODO: use serializer
    org_unit_count = serializers.IntegerField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_source_version(self, group: Group):
        return group.source_version.as_dict()

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        version = profile.account.default_version

        if version is None:
            raise serializers.ValidationError("This account has no default version")

        validated_data["source_version"] = version

        return super().create(validated_data)


class GroupsViewSet(ModelViewSet):
    """Groups API

    This API is restricted to users having the "menupermissions.iaso_org_units" permission

    GET /api/groups/
    GET /api/groups/<id>
    POST /api/groups/
    PATCH /api/groups/<id>
    DELETE /api/groups/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_org_units"),
        HasGroupPermission,
    ]
    serializer_class = GroupSerializer
    results_key = "groups"
    http_method_names = ["get", "post", "patch", "delete", "head", "options", "trace"]

    def get_queryset(self):
        light = self.request.GET.get("light", False)
        profile = self.request.user.iaso_profile
        queryset = Group.objects.filter(source_version__data_source__projects__in=profile.account.project_set.all())
        if not light:
            queryset = queryset.annotate(org_unit_count=Count("org_units"))

        version = self.request.query_params.get("version", None)
        if version:
            queryset = queryset.filter(source_version=version)
        else:
            default_version = self.request.GET.get("defaultVersion", None)
            if default_version == "true":
                queryset = queryset.filter(source_version=self.request.user.iaso_profile.account.default_version)

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        order = self.request.query_params.get("order", "name").split(",")

        return queryset.order_by(*order)
