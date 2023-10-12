from rest_framework import viewsets, permissions, serializers
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.models import OrgUnitChangeRequest


class MobileOrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "org_unit_id",
            "org_unit_uuid",
            "status",
            "approved_fields",
            "rejection_comment",
            "created_at",
            "updated_at",
            "new_parent",
            "new_name",
            "new_org_unit_type",
            "new_groups",
            "new_location",
            "new_accuracy",
            "new_reference_instances",
        ]


class MobileOrgUnitChangeRequestViewSet(ListModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    # from iaso.filters.org_unit_change_requests import OrgUnitChangeRequestListFilter
    # filterset_class = OrgUnitChangeRequestListFilter
    serializer_class = MobileOrgUnitChangeRequestListSerializer

    def get_queryset(self):
        return (
            OrgUnitChangeRequest.objects.all()
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
