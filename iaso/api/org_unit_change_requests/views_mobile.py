import django_filters

from django.contrib.auth import get_user_model
from django.db.models import Count, F, Prefetch, Q
from drf_spectacular.utils import extend_schema
from rest_framework import filters, viewsets
from rest_framework.mixins import ListModelMixin

from iaso.api.org_unit_change_requests.filters import MobileOrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.pagination import OrgUnitChangeRequestPagination
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import MobileOrgUnitChangeRequestListSerializer
from iaso.api.serializers import AppIdSerializer
from iaso.models import Instance, OrgUnit, OrgUnitChangeRequest


@extend_schema(tags=["Org unit changes", "Org units", "Mobile"])
class MobileOrgUnitChangeRequestViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = MobileOrgUnitChangeRequestListFilter
    serializer_class = MobileOrgUnitChangeRequestListSerializer
    pagination_class = OrgUnitChangeRequestPagination

    def _user_for_scoped_queries(self):
        """One row with joins; avoids extra profile/account queries on this view."""
        User = get_user_model()
        return User.objects.select_related(
            "iaso_profile__account",
            "iaso_profile__account__default_version",
        ).get(pk=self.request.user.pk)

    def get_queryset(self):
        cached_qs = getattr(self, "_cached_mobile_change_requests_queryset", None)
        if cached_qs is not None:
            return cached_qs

        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        user = self._user_for_scoped_queries()

        org_units = OrgUnit.objects.filter_for_user_and_app_id(user, app_id).filter(
            org_unit_type__projects__app_id=app_id
        )

        change_requests = (
            OrgUnitChangeRequest.objects.filter(
                org_unit__in=org_units,
                created_by=user,
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
                Prefetch(
                    "new_reference_instances",
                    queryset=Instance.non_deleted_objects.select_related("org_unit", "form").prefetch_related(
                        "instancefile_set"
                    ),
                ),
            )
            .annotate(
                annotated_new_reference_instances_count=Count(
                    "new_reference_instances", filter=Q(new_reference_instances__deleted=False)
                )
            )
            .exclude_soft_deleted_new_reference_instances()
            .distinct()
        )

        self._cached_mobile_change_requests_queryset = change_requests
        return change_requests
