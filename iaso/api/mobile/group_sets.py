from django.db.models import BooleanField, ExpressionWrapper, Q
from django.db.models.query import QuerySet
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import ListModelMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.query_params import APP_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import GroupSet, Project


class MobileGroupSetSerializer(serializers.ModelSerializer):
    erased = serializers.BooleanField(read_only=True, source="annotated_erased")

    # using none() to avoid leaking other project info
    # see __init__ to filter based on user access
    group_ids = serializers.PrimaryKeyRelatedField(source="groups", many=True, read_only=True)

    class Meta:
        model = GroupSet
        fields = [
            "id",
            "name",
            "group_ids",
            "group_belonging",
            "erased",
        ]


class MobileGroupSetsViewSet(ListModelMixin, GenericViewSet):
    """Groupsets API for Mobile.

    Allows to retrieve a list of groupsets from the API.

    Returns a lighter payload adapted for the mobile application.

    `GET /api/mobile/group_sets/?app_id=some.app.id`
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = MobileGroupSetSerializer

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id (`Project.app_id`)",
        type=openapi.TYPE_STRING,
    )

    @swagger_auto_schema(
        responses={
            200: f"List of groupset for the given '{APP_ID}'.",
            400: f"Parameter '{APP_ID}' is required.",
            404: f"Project for given '{APP_ID}' doesn't exist.",
        },
        manual_parameters=[app_id_param],
    )
    def list(self, request: Request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    def get_project(self):
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project_qs = Project.objects.select_related("account__default_version__data_source")
        return get_object_or_404(project_qs, app_id=app_id)

    def get_queryset(self) -> QuerySet:
        default_version = self.get_project().account.default_version
        # limit to the default datasource
        qs = GroupSet.objects.filter(source_version__data_source=default_version.data_source)
        # mark as erased if they don't belong to the default version
        qs = qs.annotate(
            annotated_erased=ExpressionWrapper(~Q(source_version=default_version), output_field=BooleanField())
        )

        return qs
