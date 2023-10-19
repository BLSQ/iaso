from rest_framework.mixins import ListModelMixin
from rest_framework import viewsets

from iaso.api.org_unit_change_requests.filters import OrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import OrgUnitChangeRequestListSerializer
from iaso.models import OrgUnitChangeRequest, OrgUnit


class OrgUnitChangeRequestViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filterset_class = OrgUnitChangeRequestListFilter
    serializer_class = OrgUnitChangeRequestListSerializer

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user(self.request.user)
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
