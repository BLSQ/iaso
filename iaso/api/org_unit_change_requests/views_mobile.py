from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin

from iaso.api.org_unit_change_requests.filters import MobileOrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.pagination import OrgUnitChangeRequestPagination
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import MobileOrgUnitChangeRequestListSerializer
from iaso.api.serializers import AppIdSerializer
from iaso.models import OrgUnit, OrgUnitChangeRequest


class MobileOrgUnitChangeRequestViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filterset_class = MobileOrgUnitChangeRequestListFilter
    serializer_class = MobileOrgUnitChangeRequestListSerializer
    pagination_class = OrgUnitChangeRequestPagination

    def get_queryset(self):
        app_id_serializer = AppIdSerializer(data=self.request.query_params)
        app_id_serializer.is_valid(raise_exception=True)
        app_id = app_id_serializer.validated_data["app_id"]

        org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user, app_id)

        return (
            OrgUnitChangeRequest.objects.filter(org_unit__in=org_units)
            .select_related("org_unit")
            .prefetch_related(
                "new_groups",
                "new_reference_instances",
            )
        )
