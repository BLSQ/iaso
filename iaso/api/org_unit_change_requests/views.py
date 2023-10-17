from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework import viewsets

from iaso.api.org_unit_change_requests.filters import OrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import (
    OrgUnitChangeRequestListSerializer,
    OrgUnitChangeRequestRetrieveSerializer,
)
from iaso.models import OrgUnitChangeRequest, OrgUnit


class OrgUnitChangeRequestViewSet(RetrieveModelMixin, ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filterset_class = OrgUnitChangeRequestListFilter

    def get_serializer_class(self):
        if self.action == "list":
            return OrgUnitChangeRequestListSerializer
        if self.action == "retrieve":
            return OrgUnitChangeRequestRetrieveSerializer

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user(self.request.user)
        org_units_change_requests = OrgUnitChangeRequest.objects.select_related(
            "created_by",
            "updated_by",
            "org_unit__parent",
            "org_unit__org_unit_type",
            "new_parent",
            "new_org_unit_type",
        ).prefetch_related(
            "org_unit__groups",
            "new_groups",
            "new_reference_instances",
        )
        return org_units_change_requests.filter(org_unit__in=org_units)
