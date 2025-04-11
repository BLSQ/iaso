from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.query_params import APP_ID, ORDER, PROJECT, PROJECT_IDS, SEARCH
from iaso.models import OrgUnit, OrgUnitType

from ...permissions import IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired
from ..common import ModelViewSet
from .serializers import (
    OrgUnitTypesDropdownSerializer,
    OrgUnitTypeSerializerV1,
    OrgUnitTypeSerializerV2,
    SourceVersionIdSerializer,
)


DEFAULT_ORDER = "name"


class OrgUnitTypeViewSet(ModelViewSet):
    """Org unit types API (deprecated)

    This endpoint it deprecated, Use /v2/orgunittypes/ instead, this is kept only  for compatibility with the mobile
    application

    Confusingly in this version  `sub_unit_types` map to allow_creating_sub_unit_types.
    This API is open to anonymous users.

    GET /api/orgunittypes/
    """

    permission_classes = [IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired]
    serializer_class = OrgUnitTypeSerializerV1
    results_key = "orgUnitTypes"
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]

    def destroy(self, request, pk):
        t = OrgUnitType.objects.get(pk=pk)
        if t.orgunit_set.count() > 0:
            return Response("You can't delete a type that still has org units", status=status.HTTP_401_UNAUTHORIZED)
        return super(OrgUnitTypeViewSet, self).destroy(request, pk)

    def get_queryset(self):
        queryset = OrgUnitType.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get(APP_ID)
        )
        search = self.request.query_params.get(SEARCH, None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(short_name__icontains=search))

        orders = self.request.query_params.get(ORDER, DEFAULT_ORDER).split(",")

        return queryset.order_by("depth").distinct().order_by(*orders)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["view_action"] = self.action
        return context


class OrgUnitTypeViewSetV2(ModelViewSet):
    """Org unit types API

    This API is open to anonymous users.

    GET /api/v2/orgunittypes/
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = OrgUnitTypeSerializerV2
    results_key = "orgUnitTypes"
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]

    def destroy(self, request, pk):
        t = OrgUnitType.objects.get(pk=pk)
        if t.orgunit_set.count() > 0:
            return Response("You can't delete a type that still has org units", status=status.HTTP_401_UNAUTHORIZED)
        return super(OrgUnitTypeViewSetV2, self).destroy(request, pk)

    def get_queryset(self):
        queryset = OrgUnitType.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get(APP_ID)
        )

        project = self.request.query_params.get(PROJECT, None)
        if project:
            queryset = queryset.filter(projects__id=project)

        project_ids = self.request.query_params.get(PROJECT_IDS, None)
        if project_ids:
            queryset = queryset.filter(projects__id__in=project_ids.split(","))

        search = self.request.query_params.get(SEARCH, None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(short_name__icontains=search))

        orders = self.request.query_params.get(ORDER, DEFAULT_ORDER).split(",")

        return queryset.order_by("depth").distinct().order_by(*orders)

    @action(
        permission_classes=[IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired],
        detail=False,
        methods=["GET"],
        serializer_class=OrgUnitTypesDropdownSerializer,
    )
    def dropdown(self, request, *args):
        queryset = self.get_queryset()

        version_id = SourceVersionIdSerializer(data=self.request.query_params).get_source_version_id(
            raise_exception=True
        )
        if version_id:
            type_ids_in_version = (
                OrgUnit.objects.filter(version_id=version_id)
                .distinct("org_unit_type_id")
                .values_list("org_unit_type_id", flat=True)
            )
            queryset = queryset.filter(id__in=type_ids_in_version)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["view_action"] = self.action
        return context
