from itertools import chain

import django_filters

from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
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
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
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
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        return (
            OrgUnitChangeRequestConfiguration.objects.filter(project__app_id=app_id)
            .select_related("org_unit_type")
            .prefetch_related(
                "possible_types", "possible_parent_types", "group_sets", "editable_reference_forms", "other_groups"
            )
            .order_by("org_unit_type_id")
        )

    @swagger_auto_schema(manual_parameters=[app_id_param])
    def list(self, request: Request, *args, **kwargs) -> Response:
        """
        Because some Org Unit Type restrictions are also configurable at the `Profile` level,
        we implement the following logic in the list view:

        1. If `Profile.editable_org_unit_types` empty:

            - return `OrgUnitChangeRequestConfiguration` content

        2. If `Profile.editable_org_unit_types` not empty:

            a. for org_unit_type not in `Profile.editable_org_unit_types`:

                - return a dynamic configuration that says `org_units_editable: False`
                - regardless of any existing `OrgUnitChangeRequestConfiguration`

            b. for org_unit_type in `Profile.editable_org_unit_types`:

                - return either the existing `OrgUnitChangeRequestConfiguration` content or nothing

        """
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        queryset = self.get_queryset()

        user_editable_org_unit_type_ids = self.request.user.iaso_profile.get_editable_org_unit_type_ids()

        if user_editable_org_unit_type_ids:
            project_org_unit_types = set(Project.objects.filter(app_id=app_id).values_list("unit_types__id", flat=True))
            non_editable_org_unit_type_ids = project_org_unit_types - user_editable_org_unit_type_ids

            dynamic_configurations = [
                OrgUnitChangeRequestConfiguration(
                    org_unit_type_id=org_unit_type_id,
                    org_units_editable=False,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                )
                for org_unit_type_id in non_editable_org_unit_type_ids
            ]

            # Because we're merging unsaved instances with a queryset (which is a representation of a database query),
            # we have to sort the resulting list manually to keep the pagination working properly.
            queryset = list(
                chain(
                    queryset.exclude(org_unit_type__in=non_editable_org_unit_type_ids),
                    dynamic_configurations,
                )
            )
            # Unsaved instances do not have an `id`, so we're sorting on `org_unit_type_id` in all cases.
            queryset = sorted(queryset, key=lambda item: item.org_unit_type_id)

        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
