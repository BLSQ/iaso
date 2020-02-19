from django.core.paginator import Paginator
from django.db.models import Max, Q, Count
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import AllowAny, SAFE_METHODS

from iaso.models import Form
from iaso.utils import timestamp_to_datetime
from .common import ModelViewSet, TimestampField
from hat.api.export_utils import Echo, generate_xlsx, iter_items
from .auth.authentication import CsrfExemptSessionAuthentication


class HasFormPermission(AllowAny):
    """Rules:

    - The forms API is partly accessible to anonymous users
    - Write operations are not allowed for now
    - Actions on specific forms can only be performed by users linked to an account associated with one of the form
      projects
    """

    def has_permission(self, request, view):
        if request.method not in SAFE_METHODS:  # write operations are not allowed for now
            return False

        return super().has_permission(request, view)

    def has_object_permission(self, request: Request, view, obj: Form):
        if not request.user or not request.user.is_authenticated:
            return False

        accounts = [project.account for project in obj.projects.all()]

        return request.user.iaso_profile.account in accounts


class FormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ['id', 'name', 'form_id', 'org_unit_types', 'period_type', 'single_per_period', 'created_at',
                  'updated_at']
        read_only_fields = ['id', 'org_unit_types', 'created_at', 'updated_at']

    org_unit_types = serializers.SerializerMethodField()
    created_at = TimestampField()
    updated_at = TimestampField()

    @staticmethod
    def get_org_unit_types(obj: Form):
        return [t.as_dict() for t in obj.org_unit_types.all()]


class FormsViewSet(ModelViewSet):
    """Forms API: /api/forms/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (HasFormPermission,)
    serializer_class = FormSerializer
    results_key = "forms"
    queryset = Form.objects.all()

    EXPORT_TABLE_COLUMNS = [
        {"title": "ID du formulaire", "width": 20},
        {"title": "Nom", "width": 40},
        {"title": "Enregistrement(s)", "width": 20},
        {"title": "Type", "width": 20},
        {"title": "Date de création", "width": 20},
        {"title": "Date de modification", "width": 20},
    ]
    EXPORT_FILE_NAME = "forms"
    EXPORT_ADDITIONAL_SERIALIZER_FIELDS = ["instance_updated_at", "instances_count"]

    def list(self, request: Request, *args, **kwargs):
        # The way this endpoint has been structured is due to the fact that the first mobile application
        # we did was anonymous and just downloaded everything from /api/forms. But once we introduced other applications
        # the /api/forms/ endpoint could not show all forms of the database, so, we decided that per default /api/forms/
        # would send back the forms for the app_id org.bluesquarehub.iaso
        # Once the org.bluesquarehub.iaso, we should switch to an API that will not assume it's the default

        app_id = request.GET.get("app_id", "org.bluesquarehub.iaso")
        queryset = Form.objects.all()

        if request.user and not request.user.is_anonymous:
            profile = request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)
        else:
            queryset = Form.objects.filter(projects__app_id=app_id)

        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "instance_updated_at").split(
            ","
        )  # TODO: allow this only from a predefined list for security purpose
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)
        csv_format = bool(request.query_params.get("csv", None))
        xlsx_format = bool(request.query_params.get("xlsx", None))
        org_unit_type_id = request.GET.get("orgUnitTypeId", None)

        queryset = queryset.annotate(instance_updated_at=Max("instance__updated_at"))
        queryset = queryset.annotate(
            instances_count=Count("instance", filter=(~Q(instance__file="")))
        )

        queryset = queryset.order_by(*order)
        if from_date:
            queryset = queryset.filter(
                Q(instance_updated_at__gte=from_date)
                | Q(created_at__gte=from_date)
                | Q(updated_at__gte=from_date)
            )

        if to_date:
            queryset = queryset.filter(
                Q(instance_updated_at__lte=to_date)
                | Q(created_at__lte=to_date)
                | Q(updated_at__lte=to_date)
            )

        if org_unit_type_id:
            queryset = queryset.filter(org_unit_types__id=org_unit_type_id)

        if csv_format:
            return self.list_to_csv(queryset)
        elif xlsx_format:
            return self.list_to_xlsx(queryset)
        else:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["forms"] = map(
                    lambda x: x.as_dict(self.EXPORT_ADDITIONAL_SERIALIZER_FIELDS), page.object_list
                )
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                return Response(
                    {"forms": [form.as_dict(self.EXPORT_ADDITIONAL_SERIALIZER_FIELDS) for form in queryset]}
                )

    def list_to_csv(self, queryset):
        response = StreamingHttpResponse(
            streaming_content=(iter_items(queryset, Echo(), self.EXPORT_TABLE_COLUMNS, self.get_table_row)),
            content_type="text/csv",
        )
        response["Content-Disposition"] = f"attachment; filename={self.EXPORT_FILE_NAME}.csv"

        return response

    def list_to_xlsx(self, queryset):
        response = HttpResponse(
            generate_xlsx("Forms", self.EXPORT_TABLE_COLUMNS, queryset, self.get_table_row),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f"attachment; filename={self.EXPORT_FILE_NAME}.xlsx"

        return response

    @classmethod
    def get_table_row(cls, form: Form, **kwargs):  # TODO: use serializer
        form_data = form.as_dict(cls.EXPORT_ADDITIONAL_SERIALIZER_FIELDS)
        created_at = timestamp_to_datetime(form_data.get("created_at"))
        updated_at = (
            form_data.get("instance_updated_at").strftime("%Y-%m-%d %H:%M:%S")
            if form_data.get("instance_updated_at")
            else "2019-01-01 00:00:00"
        )
        org_unit_types = ", ".join(
            [o["name"] for o in form_data.get("org_unit_types") if o is not None]
        )
        return [
            form_data.get("form_id"),
            form_data.get("name"),
            form_data.get("instances_count"),
            org_unit_types,
            created_at,
            updated_at,
        ]
