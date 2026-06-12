from django.db.models import Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from iaso.api.common import ModelViewSet
from iaso.api.permission_checks import (
    AuthenticationEnforcedPermission,
    IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired,
)
from iaso.api.query_params import APP_ID, ORDER, SEARCH
from iaso.models import OrgUnitType, Project

from ..permissions import HasOrgUnitTypeWritePermission
from ..serializers import OrgUnitTypeSerializerV1


@extend_schema(tags=["Org unit types"])
class OrgUnitTypeViewSet(ModelViewSet):
    """Org unit types API (deprecated)

    This endpoint it deprecated, Use /v2/orgunittypes/ instead, this is kept only  for compatibility with the mobile
    application

    Confusingly in this version  `sub_unit_types` map to allow_creating_sub_unit_types.
    Read: any authenticated user. Write: CORE_ORG_UNITS_TYPES_PERMISSION (staff/superuser bypass).

    GET /api/orgunittypes/
    """

    permission_classes = [
        AuthenticationEnforcedPermission,
        IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired,
        HasOrgUnitTypeWritePermission,
    ]
    serializer_class = OrgUnitTypeSerializerV1
    results_key = "orgUnitTypes"
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]
    filter_backends = [DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible]

    def destroy(self, request, pk):
        t = OrgUnitType.objects.get(pk=pk)
        if t.org_units.count() > 0:
            return Response("You can't delete a type that still has org units", status=status.HTTP_400_BAD_REQUEST)
        return super(OrgUnitTypeViewSet, self).destroy(request, pk)

    def get_queryset(self):
        queryset = OrgUnitType.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get(APP_ID)
        )

        if self.action in ["list", "retrieve"]:
            # deleting previous prefetch_related from filter_for_user_and_app_id cause I don't want to break everything
            # => more clean way would be to remove the prefetch_related from filter_for_user_and_app_id as it don't belong here
            queryset = queryset.prefetch_related(None).prefetch_related(
                Prefetch(
                    "projects",
                    queryset=Project.objects.select_related("account")
                    .prefetch_related("projectfeatureflags_set", "projectfeatureflags_set__featureflag")
                    .all(),
                ),
                "allow_creating_sub_unit_types",
                "reference_forms",
                "sub_unit_types",
            )

        search = self.request.query_params.get(SEARCH, None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(short_name__icontains=search))

        queryset = queryset.prefetch_related("allow_creating_sub_unit_types")

        app_id = self.request.query_params.get(APP_ID)
        if app_id:
            queryset = queryset.prefetch_related(
                Prefetch(
                    "allow_creating_sub_unit_types",
                    queryset=OrgUnitType.objects.filter(projects__app_id=app_id),
                    to_attr="filtered_allow_creating_sub_unit_types",
                )
            )

        orders = self.request.query_params.get(ORDER, "name").split(",")

        return queryset.order_by("depth").distinct().order_by(*orders)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["view_action"] = self.action
        return context
