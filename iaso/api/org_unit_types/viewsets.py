from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.response import Response
from iaso.api.query_params import APP_ID, ORDER, PROJECT, SEARCH

from iaso.models import OrgUnitType
from .serializers import OrgUnitTypeSerializerV1, OrgUnitTypeSerializerV2
from ..common import ModelViewSet

DEFAULT_ORDER = "name"


class OrgUnitTypeViewSet(ModelViewSet):
    """Org unit types API (deprecated)

    This endpoint it deprecated, Use /v2/orgunittypes/ instead, this is kept only  for compatibility with the mobile
    application

    Confusingly in this version  `sub_unit_types` map to allow_creating_sub_unit_types.
    This API is open to anonymous users.

    GET /api/orgunittypes/
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
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

        search = self.request.query_params.get(SEARCH, None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(short_name__icontains=search))

        orders = self.request.query_params.get(ORDER, DEFAULT_ORDER).split(",")

        return queryset.order_by("depth").distinct().order_by(*orders)
