from rest_framework import permissions

from django.db.models import Q
from iaso.models import OrgUnitType
from .serializers import OrgUnitTypeSerializer
from ..common import ModelViewSet


class OrgUnitTypeViewSet(ModelViewSet):
    """ Org unit types API

    This API is open to anonymous users (for read-only operations).

    GET /api/orgunittypes/
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = OrgUnitTypeSerializer
    results_key = "orgUnitTypes"

    def get_queryset(self):
        queryset = OrgUnitType.objects.all()
        app_id = self.request.query_params.get("app_id")
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(short_name__icontains=search)
            )

        if not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)
        elif app_id is not None:
            queryset = queryset.filter(projects__app_id=app_id)
        else:  # TODO: should be 403
            queryset = queryset.none()

        return queryset.order_by("depth").distinct().order_by("name")
