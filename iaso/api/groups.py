from rest_framework import permissions, serializers
from django.db.models import Count
import typing

from iaso.models import Group
from .common import ModelViewSet, TimestampField, HasPermission


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "source_ref",
            "source_version",
            "org_unit_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "source_ref",
            "source_version",
            "org_unit_count",
            "created_at",
            "updated_at",
        ]

    org_unit_count = serializers.IntegerField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, data: typing.MutableMapping):
        profile = self.context["request"].user.iaso_profile
        version = profile.account.default_version

        if version is None:
            raise serializers.ValidationError("This account has no default version")

        data["source_version"] = version

        return data


class GroupsViewSet(ModelViewSet):
    """ Groups API

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
    ]
    serializer_class = GroupSerializer
    results_key = "groups"
    http_method_names = ["get", "post", "patch", "delete", "head", "options", "trace"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        queryset = (
            Group.objects.filter(
                source_version__data_source__projects__in=profile.account.project_set.all()
            )
        ).annotate(org_unit_count=Count("org_units"))

        version = self.request.query_params.get("version", None)
        if version:
            queryset = queryset.filter(source_version=version)

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        order = self.request.query_params.get("order", "name").split(",")

        return queryset.order_by(*order)
