from itertools import chain

import django_filters
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import filters
from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.org_unit_change_request_configurations.pagination import OrgUnitChangeRequestConfigurationPagination
from iaso.api.org_unit_change_request_configurations.permissions import (
    HasOrgUnitsChangeRequestConfigurationReadPermission,
)
from iaso.api.org_unit_change_request_configurations.serializers import (
    MobileOrgUnitChangeRequestConfigurationListSerializer,
)
from iaso.api.query_params import APP_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import OrgUnitChangeRequestConfiguration, Project


class MobileOrgUnitChangeRequestConfigurationViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasOrgUnitsChangeRequestConfigurationReadPermission]
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    serializer_class = MobileOrgUnitChangeRequestConfigurationListSerializer
    pagination_class = OrgUnitChangeRequestConfigurationPagination

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id (`Project.app_id`)",
        type=openapi.TYPE_STRING,
    )

    def get_queryset(self):
        """
        Because some Org Unit Type restrictions are also configurable at the `Profile` level,
        we implement the following logic here:

        1. If `Profile.editable_org_unit_types` empty:

            - return `OrgUnitChangeRequestConfiguration`

        2. If `Profile.editable_org_unit_types` not empty:

            2a. for org_unit_type not in `Profile.editable_org_unit_types`:
                - return a dynamic configuration that says `org_units_editable: False`
                - regardless of any existing `OrgUnitChangeRequestConfiguration`

            2b. for org_unit_type in `Profile.editable_org_unit_types`:
                - return either the existing `OrgUnitChangeRequestConfiguration` or nothing

        """
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)

        org_unit_change_request_configurations = (
            OrgUnitChangeRequestConfiguration.objects.filter(project__app_id=app_id)
            .select_related("org_unit_type")
            .prefetch_related(
                "possible_types", "possible_parent_types", "group_sets", "editable_reference_forms", "other_groups"
            )
            .order_by("id")
        )

        user_editable_org_unit_type_ids = set(
            self.request.user.iaso_profile.editable_org_unit_types.values_list("id", flat=True)
        )

        if not user_editable_org_unit_type_ids:
            return org_unit_change_request_configurations

        project_org_unit_types = set(Project.objects.get(app_id=app_id).unit_types.values_list("id", flat=True))

        non_editable_org_unit_type_ids = project_org_unit_types - user_editable_org_unit_type_ids

        dynamic_configurations = [
            OrgUnitChangeRequestConfiguration(org_unit_type_id=org_unit_type_id, org_units_editable=False)
            for org_unit_type_id in non_editable_org_unit_type_ids
        ]

        # A queryset is a representation of a database query, so it's difficult to add unsaved objects manually.
        # This trick will return a list but some features like `order_by` will not work for unsaved objects.
        return list(
            chain(
                org_unit_change_request_configurations.exclude(org_unit_type__in=non_editable_org_unit_type_ids),
                dynamic_configurations,
            )
        )

    @swagger_auto_schema(manual_parameters=[app_id_param])
    def list(self, request: Request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)
