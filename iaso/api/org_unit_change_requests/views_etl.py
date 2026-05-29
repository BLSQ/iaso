from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from dynamic_fields.filter_backends import DynamicFieldsFilterBackend
from iaso.api.common.views import ReadOnlyModelViewSet
from iaso.api.org_unit_change_requests.filters import ETLOrgUnitChangeRequestFilter
from iaso.api.org_unit_change_requests.pagination import ETLOrgUnitChangeRequestPagination
from iaso.api.org_unit_change_requests.serializers.etl import ETLOrgUnitChangeRequestListSerializer
from iaso.models import Group, Instance, OrgUnit, OrgUnitChangeRequest


@extend_schema(tags=["ETL"])
class ETLOrgUnitChangeRequestViewSet(ReadOnlyModelViewSet):
    serializer_class = ETLOrgUnitChangeRequestListSerializer
    filter_backends = [OrderingFilter, DjangoFilterBackend, DynamicFieldsFilterBackend]
    pagination_class = ETLOrgUnitChangeRequestPagination
    permission_classes = [IsAuthenticated]
    ordering = "id"
    filterset_class = ETLOrgUnitChangeRequestFilter

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user(self.request.user).values_list("pk")
        return (
            OrgUnitChangeRequest.objects.exclude_soft_deleted_new_reference_instances()
            .filter(org_unit__in=org_units)
            .filter_on_user_projects(self.request.user)
            .prefetch_related(
                Prefetch("new_groups", queryset=Group.objects.only("id").all()),
                Prefetch("new_reference_instances", queryset=Instance.objects.only("id").all()),
                Prefetch("old_groups", queryset=Group.objects.only("id").all()),
                Prefetch("old_reference_instances", queryset=Instance.objects.only("id").all()),
            )
        )
