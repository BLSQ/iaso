from rest_framework import viewsets, permissions, serializers
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.api_filters.org_unit_change_requests import OrgUnitChangeRequestListFilter
from iaso.models import OrgUnitChangeRequest, OrgUnit


class OrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
    org_unit_name = serializers.CharField(source="org_unit.name")
    org_unit_type_id = serializers.IntegerField(source="org_unit.org_unit_type.id")
    org_unit_type_name = serializers.CharField(source="org_unit.org_unit_type.name")
    groups = serializers.SerializerMethodField(method_name="get_current_org_unit_groups")
    created_by = serializers.CharField(source="created_by.username", default="")
    updated_by = serializers.CharField(source="updated_by.username", default="")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "org_unit_id",
            "org_unit_uuid",
            "org_unit_name",
            "org_unit_type_id",
            "org_unit_type_name",
            "status",
            "groups",
            "requested_fields",
            "approved_fields",
            "rejection_comment",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]

    def get_current_org_unit_groups(self, obj: OrgUnitChangeRequest):
        return [group.name for group in obj.org_unit.groups.all()]


class OrgUnitChangeRequestViewSet(ListModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = OrgUnitChangeRequestListFilter
    serializer_class = OrgUnitChangeRequestListSerializer

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user)
        return (
            OrgUnitChangeRequest.objects.filter(org_unit__in=org_units)
            .select_related(
                "org_unit__parent",
                "org_unit__org_unit_type",
                "new_parent",
                "new_org_unit_type",
            )
            .prefetch_related(
                "org_unit__groups",
                "new_groups",
                "new_reference_instances",
            )
        )
