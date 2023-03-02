from django.utils.datastructures import MultiValueDictKeyError
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.query_params import APP_ID, APP_VERSION
from iaso.models import Project


class CheckVersionViewSet(ViewSet):
    """Check Version API

    This API is open to anonymous users:

    /api/mobile/checkversion/

    `GET /api/mobile/checkversion/?app_id=some.app.id&app_version=1234`
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ["get", "head", "options"]
    lookup_url_kwarg = [APP_ID, APP_VERSION]

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )
    app_version_param = openapi.Parameter(
        name=APP_VERSION,
        in_=openapi.IN_QUERY,
        required=True,
        description="Version to be tested",
        type=openapi.TYPE_INTEGER,
    )

    @swagger_auto_schema(
        responses={
            204: "version provided for given app id is valid",
            400: f"parameters '{APP_ID}' or '{APP_VERSION}' were not provided or '{APP_VERSION}' is not an integer",
            404: "project for given app id doesn't exist",
            426: "version provided for given app id is **not** valid",
        },
        manual_parameters=[app_id_param, app_version_param],
    )
    def list(self, request: Request, *args, **kwargs):
        # region input validation
        try:
            app_id = request.GET[APP_ID]
            if app_id is None or app_id == "":
                raise ValidationError(f"parameters '{APP_ID}' is required")
        except MultiValueDictKeyError:
            raise ValidationError(f"parameters '{APP_ID}' is required")
        try:
            app_version = int(request.GET[APP_VERSION])
        except MultiValueDictKeyError:
            raise ValidationError(f"parameters '{APP_VERSION}' is required")
        except ValueError:
            raise ValidationError(f"parameters '{APP_VERSION}' must be an integer")
        # endregion

        project = get_object_or_404(Project, app_id=app_id)
        project_min_version = project.min_version

        if project_min_version is not None and app_version < project_min_version:
            return Response(data={"min_version": project_min_version}, status=status.HTTP_426_UPGRADE_REQUIRED)

        return Response(status=status.HTTP_204_NO_CONTENT)
