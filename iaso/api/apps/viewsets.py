from django.http import Http404
from rest_framework import permissions
from rest_framework.request import Request

from .serializers import AppSerializer
from ..common import ModelViewSet
from ...models import Project


class AppsViewSet(ModelViewSet):
    """Apps API

    The "app" resource is a proxy of the "project" resource, to be consumed by the mobile API.
    The project "app_id" field should be used as the primary key.

    The idea behind the endpoint is to "hide" projects from the mobile app, and just expose app settings for a
    single app.

    This API is open to anonymous users.

    GET /api/apps/<app_id>/
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = AppSerializer
    lookup_field = "app_id"
    lookup_value_regex = r"[\w.]+"  # allow dots in the pk url param
    http_method_names = ["get", "head", "options", "trace"]
    queryset = Project.objects.all()
    results_key = "apps"

    def list(self, request: Request, *args, **kwargs):
        raise Http404
