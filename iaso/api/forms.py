from datetime import timedelta
import typing
from django.db.models import Max, Q, Count
from django.http import StreamingHttpResponse, HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import serializers, permissions
from rest_framework.request import Request
from iaso.models import Form, Project, OrgUnitType
from iaso.utils import timestamp_to_datetime
from .common import ModelViewSet, TimestampField
from hat.api.export_utils import Echo, generate_xlsx, iter_items
from .projects import ProjectSerializer, HasProjectPermission
from hat.api.authentication import UserAccessPermission


class HasFormPermission(permissions.BasePermission):
    """Rules:

    - The forms API is partly accessible to anonymous users
    - Actions on specific forms can only be performed by users linked to an account associated with one of the form
      projects
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_authenticated

    def has_object_permission(self, request: Request, view, obj: Form):
        if not request.user.is_authenticated:
            return False

        accounts = [project.account for project in obj.projects.all()]

        return request.user.iaso_profile.account in accounts


class FormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = [
            "id",
            "name",
            "form_id",
            "device_field",
            "location_field",
            "org_unit_types",
            "org_unit_type_ids",
            "projects",
            "project_ids",
            "period_type",
            "single_per_period",
            "periods_before_allowed",
            "periods_after_allowed",
            "latest_form_version",
            "instances_count",
            "instance_updated_at",
            "created_at",
            "updated_at",
            "derived",
        ]
        read_only_fields = [
            "id",
            "form_id",
            "org_unit_types",
            "projects",
            "instances_count",
            "instance_updated_at",
            "created_at",
            "updated_at",
        ]

    org_unit_types = serializers.SerializerMethodField()
    org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="org_unit_types",
        write_only=True,
        many=True,
        allow_empty=False,
        queryset=OrgUnitType.objects.all(),
    )
    projects = ProjectSerializer(read_only=True, many=True)
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects",
        write_only=True,
        many=True,
        allow_empty=False,
        queryset=Project.objects.all(),
    )
    latest_form_version = (
        serializers.SerializerMethodField()
    )  # TODO: use FormSerializer
    instances_count = serializers.IntegerField(read_only=True)
    instance_updated_at = TimestampField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_latest_form_version(obj: Form):
        return obj.latest_version.as_dict() if obj.latest_version is not None else None

    @staticmethod
    def get_org_unit_types(obj: Form):
        return [t.as_dict() for t in obj.org_unit_types.all()]

    def validate(self, data: typing.Mapping):
        # validate projects (access check)
        permission_checker = HasProjectPermission()
        for project in data["projects"]:
            if not permission_checker.has_object_permission(
                self.context["request"], self.context["view"], project
            ):
                raise serializers.ValidationError(
                    {"project_ids": "Invalid project ids"}
                )

        # validate org_unit_types against projects
        allowed_org_unit_types = [
            ut for p in data["projects"] for ut in p.unit_types.all()
        ]
        if len(set(data["org_unit_types"]) - set(allowed_org_unit_types)) > 0:
            raise serializers.ValidationError(
                {"org_unit_type_ids": "Invalid org unit type ids"}
            )

        # If the period type is None, some period-specific fields must have specific values
        if data["period_type"] is None:
            tracker_errors = {}
            if data["single_per_period"] is not False:
                tracker_errors["single_per_period"] = "Should be false"
            if data["periods_before_allowed"] != 0:
                tracker_errors["periods_before_allowed"] = "Should be 0"
            if data["periods_after_allowed"] != 0:
                tracker_errors["periods_after_allowed"] = "Should be 0"
            if tracker_errors:
                raise serializers.ValidationError(tracker_errors)

        return data


class FormsViewSet(ModelViewSet):
    """Forms API: /api/forms/"""

    permission_required = [
        "menupermissions.iaso_forms",
        "menupermissions.iaso_org_units",
    ]
    permission_classes = [HasFormPermission, UserAccessPermission]
    serializer_class = FormSerializer
    results_key = "forms"
    queryset = Form.objects.all()

    EXPORT_TABLE_COLUMNS = (
        {"title": "ID du formulaire", "width": 20},
        {"title": "Nom", "width": 40},
        {"title": "Enregistrement(s)", "width": 20},
        {"title": "Type", "width": 20},
        {"title": "Date de création", "width": 20},
        {"title": "Date de modification", "width": 20},
    )
    EXPORT_FILE_NAME = "forms"
    EXPORT_ADDITIONAL_SERIALIZER_FIELDS = ("instance_updated_at", "instances_count")

    def get_queryset(self):
        queryset = Form.objects.all()
        queryset = queryset.annotate(instance_updated_at=Max("instances__updated_at"))
        queryset = queryset.annotate(
            instances_count=Count("instances", filter=(~Q(instances__file="")))
        )

        # The way this endpoint has been structured is due to the fact that the first mobile application
        # we did was anonymous and just downloaded everything from /api/forms. But once we introduced other applications
        # the /api/forms/ endpoint could not show all forms of the database, so, we decided that per default /api/forms/
        # would send back the forms for the app_id org.bluesquarehub.iaso
        # Once the org.bluesquarehub.iaso, we should switch to an API that will not assume it's the default
        if self.request.user and not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)
        else:
            app_id = self.request.query_params.get("app_id", "org.bluesquarehub.iaso")
            queryset = queryset.filter(projects__app_id=app_id)
            queryset = queryset.exclude(derived=True)

        from_date = self.request.query_params.get("date_from", None)
        if from_date:
            queryset = queryset.filter(
                Q(instance_updated_at__gte=from_date)
                | Q(created_at__gte=from_date)
                | Q(updated_at__gte=from_date)
            )
        to_date = self.request.query_params.get("date_to", None)
        if to_date:
            parsed_to_date = parse_date(to_date) + timedelta(days=1)
            queryset = queryset.filter(
                Q(instance_updated_at__lt=parsed_to_date)
                | Q(created_at__lt=parsed_to_date)
                | Q(updated_at__lt=parsed_to_date)
            )

        org_unit_type_id = self.request.query_params.get("orgUnitTypeId", None)
        if org_unit_type_id:
            queryset = queryset.filter(org_unit_types__id=org_unit_type_id)

        # TODO: allow this only from a predefined list for security purposes
        order = self.request.query_params.get("order", "instance_updated_at").split(",")
        queryset = queryset.order_by(*order)

        return queryset

    def list(self, request: Request, *args, **kwargs):
        # TODO: use accept header to determine format - or at least the standard "format" parameter
        # DRF also provides a mechanic for custom renderer
        # see https://www.django-rest-framework.org/api-guide/renderers/
        csv_format = bool(request.query_params.get("csv", None))
        xlsx_format = bool(request.query_params.get("xlsx", None))

        if csv_format:
            return self.list_to_csv()
        elif xlsx_format:
            return self.list_to_xlsx()

        return super().list(request, *args, **kwargs)

    def list_to_csv(self):
        response = StreamingHttpResponse(
            streaming_content=(
                iter_items(
                    self.get_queryset(),
                    Echo(),
                    self.EXPORT_TABLE_COLUMNS,
                    self.get_table_row,
                )
            ),
            content_type="text/csv",
        )
        response[
            "Content-Disposition"
        ] = f"attachment; filename={self.EXPORT_FILE_NAME}.csv"

        return response

    def list_to_xlsx(self):
        response = HttpResponse(
            generate_xlsx(
                "Forms",
                self.EXPORT_TABLE_COLUMNS,
                self.get_queryset(),
                self.get_table_row,
            ),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response[
            "Content-Disposition"
        ] = f"attachment; filename={self.EXPORT_FILE_NAME}.xlsx"

        return response

    def get_table_row(self, form: Form, **kwargs):  # TODO: use serializer
        form_data = self.get_serializer(form).data
        created_at = timestamp_to_datetime(form_data.get("created_at"))
        updated_at = (
            timestamp_to_datetime(form_data.get("instance_updated_at"))
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
