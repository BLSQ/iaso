from rest_framework import permissions

from iaso.models import OrgUnitType
from .serializers import OrgUnitTypeSerializer
from ..common import ModelViewSet


class OrgUnitTypeViewSet(ModelViewSet):
    """ Org unit types API

    This API is open to anonymous users.

    GET /api/orgunittypes/
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = OrgUnitTypeSerializer
    results_key = "orgUnitTypes"
    http_method_names = ["get", "post", "put", "delete", "head", "options", "trace"]

    def get_queryset(self):
        queryset = OrgUnitType.objects.all()
        app_id = self.request.query_params.get("app_id")

        if not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)
        elif app_id is not None:
            queryset = queryset.filter(projects__app_id=app_id)
        else:  # TODO: should be 403
            queryset = queryset.none()

        return queryset.order_by("depth").distinct().order_by("name")
