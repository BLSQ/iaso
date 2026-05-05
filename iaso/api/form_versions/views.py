from django.db.models import BooleanField, CharField, Count, F, TextField, Value
from django.db.models.expressions import Case, When
from django.db.models.functions import Concat
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import exceptions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from iaso.api.common import ModelViewSet
from iaso.api.form_versions.permissions import HasFormVersionPermission
from iaso.api.form_versions.serializers import (
    FormVersionDiffSerializer,
    FormVersionPreviewSerializer,
    FormVersionSerializer,
)
from iaso.api.query_params import APP_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import FeatureFlag, FormVersion, Project
from iaso.odk.diff import compute_form_version_diff


@extend_schema(tags=["Form versions"])
class FormVersionsViewSet(ModelViewSet):
    f"""Form versions API

    This API is open to anonymous users only if `{FeatureFlag.REQUIRE_AUTHENTICATION}` is not set and an `{APP_ID}`
    parameter is given.

    GET /api/formversions/
    GET /api/formversions/<id>
    POST /api/formversions/
    PUT /api/formversions/<id>  -- can only update start_period and end_period
    PATCH /api/formversions/<id>  -- can only update start_period and end_period
    """

    serializer_class = FormVersionSerializer
    permission_classes = [HasFormVersionPermission]
    results_key = "form_versions"
    queryset = FormVersion.objects.all()
    parser_classes = (parsers.MultiPartParser, parsers.JSONParser)
    http_method_names = ["get", "put", "post", "head", "options", "trace", "patch"]
    filter_backends = [DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible]

    def get_serializer_class(self):
        if self.action == "preview":
            return FormVersionPreviewSerializer
        return FormVersionSerializer

    def get_queryset(self):
        orders = self.request.query_params.get("order", "full_name").split(",")
        mapped_filter = self.request.query_params.get("mapped", "")

        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id is not None:
            try:
                Project.objects.get_for_user_and_app_id(user=self.request.user, app_id=app_id)
            except Project.DoesNotExist:
                if self.request.user.is_anonymous:
                    raise exceptions.NotAuthenticated
                raise exceptions.NotFound(f"Project not found for {app_id}")
            queryset = FormVersion.objects.filter(form__projects__app_id=app_id)
        elif self.request.user.is_anonymous:
            raise exceptions.NotAuthenticated
        else:
            profile = self.request.user.iaso_profile
            queryset = FormVersion.objects.filter(form__projects__account=profile.account)

        # We don't send versions for deleted forms
        queryset = queryset.filter(form__deleted_at=None)
        search_name = self.request.query_params.get("search_name", None)
        if search_name:
            queryset = queryset.annotate(
                full_name=Concat(
                    F("form__name"),
                    Value(" - "),
                    F("version_id"),
                    output_field=CharField(),
                )
            ).filter(full_name__icontains=search_name)

        form_id = self.request.query_params.get("form_id", None)
        if form_id:
            queryset = queryset.filter(form__id=form_id)
        version_id = self.request.query_params.get("version_id", None)
        if version_id:
            queryset = queryset.filter(version_id=version_id)

        queryset = queryset.annotate(
            full_name=Concat("form__name", Value(" - V"), "version_id", output_field=TextField())
        )

        queryset = queryset.annotate(mapping_versions_count=Count("mapping_versions"))

        queryset = queryset.annotate(
            mapped=Case(When(mapping_versions_count__gt=0, then=True), default=False, output_field=BooleanField())
        )

        if mapped_filter:
            queryset = queryset.filter(mapped=(mapped_filter == "true"))

        queryset = queryset.select_related("form", "created_by", "updated_by").prefetch_related("mapping_versions")

        queryset = queryset.order_by(*orders)

        return queryset

    @extend_schema(responses={200: FormVersionDiffSerializer})
    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request, *args, **kwargs):
        """Return a diff of questions added/removed compared to the latest version without saving."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        diff = compute_form_version_diff(
            previous_form_version=serializer.validated_data["previous_form_version"],
            survey=serializer.validated_data["survey"],
        )
        return Response(FormVersionDiffSerializer(diff).data)
