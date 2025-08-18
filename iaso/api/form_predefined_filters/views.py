from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import exceptions
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request

from hat.menupermissions.constants import core_permissions
from iaso.api.common import ModelViewSet
from iaso.api.form_predefined_filters.permissions import HasFormPredefinedFilterPermission
from iaso.api.form_predefined_filters.serializers import FormIdSerializer, FormPredefinedFilterSerializer
from iaso.api.query_params import FORM_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import Form, FormPredefinedFilter, Project


class FormPredefinedFiltersViewSet(ModelViewSet):
    f"""Form Predefined Filters API

        Read-only methods are accessible to anonymous users. All other actions are restricted to authenticated users
        having the "{core_permissions.FORMS}"  permission.

        GET /api/formpredefinedfilters/
        GET /api/formpredefinedfilters/<id>
        POST /api/formpredefinedfilters/
        PUT /api/formpredefinedfilters/<id>
        PATCH /api/formpredefinedfilters/<id>
        DELETE /api/formpredefinedfilters/<id>
        """

    permission_classes = [HasFormPredefinedFilterPermission]
    serializer_class = FormPredefinedFilterSerializer
    results_key = "form_predefined_filters"
    http_method_names = ["get", "put", "post", "head", "options", "trace", "patch", "delete"]

    def get_queryset(self, mobile=False):
        orders = self.request.query_params.get("order", "name").split(",")
        queryset = FormPredefinedFilter.objects
        # We don't send filters for deleted forms
        queryset = queryset.filter(form__deleted_at=None)
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id is not None:
            try:
                Project.objects.get_for_user_and_app_id(user=self.request.user, app_id=app_id)
            except Project.DoesNotExist:
                if self.request.user.is_anonymous:
                    raise exceptions.NotAuthenticated
                raise exceptions.NotFound(f"Project not found for {app_id}")
            queryset = queryset.filter(form__projects__app_id=app_id)
        elif self.request.user.is_anonymous:
            raise exceptions.NotAuthenticated
        else:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(form__projects__account=profile.account)

        serializer = FormIdSerializer(data=self.request.query_params)
        form_id = serializer.validated_data[FORM_ID] if serializer.is_valid(raise_exception=True) else None
        if form_id:
            form = get_object_or_404(
                queryset=Form.objects.filter_for_user_and_app_id(self.request.user, app_id).distinct(),
                id=form_id,
            )
            queryset = queryset.filter(form=form)
        return queryset.order_by(*orders).distinct()

    form_id_param = openapi.Parameter(
        name=FORM_ID,
        in_=openapi.IN_QUERY,
        description="Form id",
        type=openapi.TYPE_NUMBER,
    )

    @swagger_auto_schema(
        responses={
            200: "provides the latest updated dates",
            404: "Form for given form id doesn't exist",
        },
        manual_parameters=[form_id_param],
    )
    def list(self, request: Request):
        return super().list(request)
