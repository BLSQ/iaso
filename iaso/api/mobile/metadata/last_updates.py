from django.db.models import Max
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.query_params import APP_ID
from iaso.models import Form, FormVersion, OrgUnit, OrgUnitType, Project


class LastUpdatesViewSet(ViewSet):
    """Metadata Last Updates

    This API is open to anonymous users:

    /api/mobile/metadata/lastupdates/

    `GET /api/mobile/metadata/lastupdates/?app_id=some.app.id`
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ["get", "head", "options"]
    lookup_url_kwarg = [APP_ID]

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )

    @swagger_auto_schema(
        responses={
            200: "provides the latest updated dates",
            400: f"parameter '{APP_ID}' was not provided",
            404: "project for given app id doesn't exist",
        },
        manual_parameters=[app_id_param],
    )
    def list(self, request: Request):
        app_id = request.query_params.get(APP_ID)
        if app_id is None or app_id == "":
            raise ValidationError(f"parameters '{APP_ID}' is required")

        forms = Form.objects
        form_versions = FormVersion.objects
        org_units = OrgUnit.objects
        org_unit_types = OrgUnitType.objects
        if app_id is not None:
            get_object_or_404(Project, app_id=app_id)  # Just checking the app_id exists
            forms = forms.filter_for_user_and_app_id(user=request.user, app_id=app_id)
            form_versions = form_versions.filter(form__in=forms)
            org_units = org_units.filter_for_user_and_app_id(user=request.user, app_id=app_id)
            org_unit_types = org_unit_types.filter_for_user_and_app_id(user=request.user, app_id=app_id)

        return Response(
            data={
                "forms": self.max_date(forms, form_versions),
                "org_units": self.max_date(org_units, org_unit_types),
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def max_date(left, right):
        left_updated_at = left.aggregate(Max("updated_at"))["updated_at__max"]
        right_updated_at = right.aggregate(Max("updated_at"))["updated_at__max"]
        if left_updated_at and right_updated_at:
            return max(left_updated_at, right_updated_at).timestamp()
        if left_updated_at:
            return left_updated_at.timestamp()
        if right_updated_at:
            return right_updated_at.timestamp()
        return None
