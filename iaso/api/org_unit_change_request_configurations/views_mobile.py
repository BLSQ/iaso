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
from iaso.models import OrgUnitChangeRequestConfiguration


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
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        return (
            OrgUnitChangeRequestConfiguration.objects.filter(project__app_id=app_id)
            .select_related("org_unit_type")
            .prefetch_related(
                "possible_types", "possible_parent_types", "group_sets", "editable_reference_forms", "other_groups"
            )
            .order_by("id")
        )

    @swagger_auto_schema(manual_parameters=[app_id_param])
    def list(self, request: Request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)
