from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.response import Response

from iaso.models import OrgUnitType
from .serializers import OrgUnitTypeSerializer
from ..common import ModelViewSet


class OrgUnitTypeViewSet(ModelViewSet):
    """Org unit types API

    This API is open to anonymous users.

    GET /api/orgunittypes/
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = OrgUnitTypeSerializer
    results_key = "orgUnitTypes"
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]

    def destroy(self, request, pk):
        t = OrgUnitType.objects.get(pk=pk)
        if t.orgunit_set.count() > 0:
            return Response("You can't delete a type that still has org units", status=status.HTTP_401_UNAUTHORIZED)
        return super(OrgUnitTypeViewSet, self).destroy(request, pk)

    def get_queryset(self):
        queryset = OrgUnitType.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        )

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(short_name__icontains=search))

        return queryset.order_by("depth").distinct().order_by("name")
