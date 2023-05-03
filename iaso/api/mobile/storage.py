from django.utils.datastructures import MultiValueDictKeyError
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from iaso.api.common import ModelViewSet, TimestampField
from iaso.api.query_params import APP_ID
from iaso.models import Project
from iaso.models import StoragePassword
from iaso.permissions import ReadOnly


class MobileStoragePasswordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoragePassword
        fields = ["password", "is_compromised", "created_at", "updated_at"]

    created_at = TimestampField()
    updated_at = TimestampField()


class MobileStoragePasswordViewSet(ModelViewSet):
    """
    Storage passwords API used by the mobile application

    This API requires authentication and an app_id

    GET /api/mobile/storages/passwords?app_id=some.app.id
    GET /api/mobile/storage/passwords?app_id=some.app.id [Deprecated] will be removed in the future
    """

    http_method_names = ["get", "head", "options"]
    remove_results_key_if_paginated = False
    results_key = "passwords"
    permission_classes = [IsAuthenticated, ReadOnly]
    serializer_class = MobileStoragePasswordSerializer
    lookup_url_kwarg = APP_ID

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )

    @swagger_auto_schema(
        responses={
            200: "version provided for given app id is valid",
            400: f"parameters '{APP_ID}' was not provided",
            404: "project for given app id doesn't exist",
        },
        manual_parameters=[app_id_param],
    )
    def get_queryset(self):
        try:
            app_id = self.request.GET[APP_ID]
            if app_id is None or app_id == "":
                raise ValidationError(f"parameters '{APP_ID}' is required")
        except MultiValueDictKeyError:
            raise ValidationError(f"parameters '{APP_ID}' is required")

        project = get_object_or_404(Project, app_id=app_id, account=self.request.user.iaso_profile.account)
        return StoragePassword.objects.order_by("-created_at").filter(project=project)
