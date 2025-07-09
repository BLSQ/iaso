import django_filters

from django.db.models import Count, F, Prefetch, Q
from rest_framework import filters, viewsets
from rest_framework.mixins import ListModelMixin

from iaso.api.org_unit_change_requests.filters import MobileOrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.pagination import OrgUnitChangeRequestPagination
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import MobileOrgUnitChangeRequestListSerializer
from iaso.api.serializers import AppIdSerializer
from iaso.models import Instance, OrgUnit, OrgUnitChangeRequest


class MobileOrgUnitChangeRequestViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = MobileOrgUnitChangeRequestListFilter
    serializer_class = MobileOrgUnitChangeRequestListSerializer
    pagination_class = OrgUnitChangeRequestPagination

    def get_queryset(self):
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user, app_id).filter(
            org_unit_type__projects__app_id=app_id
        )

        change_requests = (
            OrgUnitChangeRequest.objects.filter(
                org_unit__in=org_units,
                created_by=self.request.user,
                # Change requests liked to a `data_source_synchronization` are limited to the web.
                data_source_synchronization__isnull=True,
            )
            .annotate(
                total_new_reference_instances=Count("new_reference_instances", distinct=True),
                total_new_reference_instances_in_project=Count(
                    "new_reference_instances", Q(new_reference_instances__project__app_id=app_id), distinct=True
                ),
                total_new_reference_instances__form_in_project=Count(
                    "new_reference_instances", Q(new_reference_instances__form__projects__app_id=app_id), distinct=True
                ),
            )
            .filter(
                Q(new_reference_instances__isnull=True)
                | Q(total_new_reference_instances=F("total_new_reference_instances_in_project"))
                & Q(total_new_reference_instances=F("total_new_reference_instances__form_in_project"))
            )
            .select_related("org_unit")
            .prefetch_related(
                "new_groups",
                Prefetch("new_reference_instances", queryset=Instance.non_deleted_objects.all()),
            )
            .annotate(
                annotated_new_reference_instances_count=Count(
                    "new_reference_instances", filter=Q(new_reference_instances__deleted=False)
                )
            )
            .exclude_soft_deleted_new_reference_instances()
        )

        return change_requests
