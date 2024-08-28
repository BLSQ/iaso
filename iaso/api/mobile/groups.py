from typing import Dict, Any

from django.db.models.query import QuerySet
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import ListModelMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.query_params import APP_ID, SHOW_DELETED
from iaso.api.serializers import AppIdSerializer
from iaso.models import Group, Project, SourceVersion


class MobileGroupSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.source_version = kwargs["context"].get("source_version")

    erased = serializers.SerializerMethodField()

    def get_erased(self, obj: Group):
        return obj.source_version.id != self.source_version

    @staticmethod
    def include_source_version(context: Dict[str, Any], source_version: SourceVersion) -> Dict[str, Any]:
        context["source_version"] = source_version.id
        return context

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "erased",
        ]


class MobileGroupsViewSet(ListModelMixin, GenericViewSet):
    """Groups API for Mobile.

    Allows to retrieve a list of groups from the API.

    Returns a lighter payload adapted for the mobile application.

    `GET /api/mobile/groups/?app_id=some.app.id`
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = MobileGroupSerializer

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id (`Project.app_id`)",
        type=openapi.TYPE_STRING,
    )

    show_deleted_param = openapi.Parameter(
        name=SHOW_DELETED,
        in_=openapi.IN_QUERY,
        required=False,
        description="Include deleted groups",
        type=openapi.TYPE_BOOLEAN,
        default=False,
    )

    @swagger_auto_schema(
        responses={
            200: f"List of groups for the given '{APP_ID}'.",
            400: f"Parameter '{APP_ID}' is required.",
            404: f"Project for given '{APP_ID}' doesn't exist.",
        },
        manual_parameters=[app_id_param, show_deleted_param],
    )
    def list(self, request: Request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    def get_serializer_context(self) -> Dict[str, Any]:
        context = super().get_serializer_context()
        return self.serializer_class.include_source_version(context, self.get_project().account.default_version)

    def get_project(self):
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project_qs = Project.objects.select_related("account__default_version__data_source")
        return get_object_or_404(project_qs, app_id=app_id)

    def get_queryset(self) -> QuerySet:
        objects = Group.objects
        if self.request.query_params.get(SHOW_DELETED) != "true":
            objects = objects.filter(source_version=self.get_project().account.default_version)
        else:
            objects = objects.filter(source_version__data_source=self.get_project().account.default_version.data_source)
        return objects
