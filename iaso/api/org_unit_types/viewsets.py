from rest_framework import permissions

from django.db.models import Q
from iaso.models import OrgUnitType, Project
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
    http_method_names = [
        "get",
        "post",
        "patch",
        "put",
        "delete",
        "head",
        "options",
        "trace",
    ]

    def get_queryset(self):
        user = self.request.user
        app_id = self.request.query_params.get("app_id")

        # no auth, no app id : -> no results
        if user.is_anonymous and app_id is None:
            return OrgUnitType.objects.none()

        queryset = OrgUnitType.objects.all()

        if user.is_authenticated:
            queryset = queryset.filter(projects__account=user.iaso_profile.account)

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                queryset = queryset.filter(projects__in=[project])
            except Project.DoesNotExist:
                return queryset.none()

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(short_name__icontains=search)
            )

        return queryset.order_by("depth").distinct().order_by("name")
