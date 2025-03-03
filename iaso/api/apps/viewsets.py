from django.http import Http404
from rest_framework import permissions
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request

from ...models import Project
from ..common import ModelViewSet
from .serializers import AppSerializer


class AppsViewSet(ModelViewSet):
    """Apps API

    The "app" resource is a proxy of the "project" resource, to be consumed by the mobile API.
    The project "app_id" field should be used as the primary key.

    The idea behind the endpoint is to "hide" projects from the mobile app, and just expose app settings for a
    single app.

    This API is open to anonymous users:

    - `GET /api/apps/current/?app_id=some.app.id`

    - `GET /api/apps/<app_id>/`
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = AppSerializer
    lookup_field = "app_id"
    lookup_value_regex = r"[\w.]+"  # allow dots in the pk url param
    http_method_names = ["get", "post", "put", "head", "options", "trace"]
    # queryset = Project.objects.all()
    results_key = "apps"

    def get_queryset(self):
        return Project.objects.all()

    def get_object(self):
        """Override to handle GET /api/apps/current/?app_id=some.app.id"""
        if self.kwargs["app_id"] == "current":
            app_id = self.request.query_params.get("app_id", None)
            if app_id is None:
                raise Http404
            if self.request.user.is_anonymous:
                try:
                    p = Project.objects.get(app_id=app_id)
                    account = p.account
                except Project.DoesNotExist:
                    raise Http404
            else:
                account = self.request.user.iaso_profile.account

            return get_object_or_404(self.get_queryset(), account=account, app_id=app_id)
        return super().get_object()

    def list(self, request: Request, *args, **kwargs):
        raise Http404
