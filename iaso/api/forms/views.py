from datetime import timedelta

from django.db.models import Count, Exists, OuterRef, Prefetch, Q, Subquery
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import FORM_API, log_modification
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX, ModelViewSet, is_field_referenced
from iaso.api.forms.utils import generate_manifest_for_form
from iaso.api.permission_checks import AuthenticationEnforcedPermission, ReadOnly
from iaso.api.serializers import AppIdSerializer
from iaso.enketo.enketo_url import enketo_settings, verify_signed_url
from iaso.models import Form, FormAttachment, Instance, Mapping, OrgUnit, ProjectFeatureFlags
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.utils.date_and_time import timestamp_to_datetime

from .permissions import HasFormPermission
from .serializers import FormDropdownSerializer, FormSerializer


@extend_schema(tags=["Forms"])
class FormsViewSet(ModelViewSet):
    f"""Forms API

    Read-only methods are accessible to anonymous users. All other actions are restricted to authenticated users
    having the "{CORE_FORMS_PERMISSION}" permission.

    GET /api/forms/
    GET /api/forms/<id>
    POST /api/forms/
    PUT /api/forms/<id>
    PATCH /api/forms/<id>
    DELETE /api/forms/<id>
    """

    permission_classes = [AuthenticationEnforcedPermission, HasFormPermission]
    serializer_class = FormSerializer
    results_key = "forms"

    # always exported, whatever the visible columns of the forms list
    EXPORT_BASE_COLUMNS = (
        {"field": "form_id", "title": "ID du formulaire", "width": 20},
        {"field": "name", "title": "Nom", "width": 40},
        {"field": "org_unit_types", "title": "Type", "width": 20},
        {"field": "org_unit_groups", "title": "Groupes", "width": 20},
        {"field": "period_type", "title": "Périodicité", "width": 20},
        {"field": "single_per_period", "title": "Une seule réponse par période", "width": 20},
        {"field": "created_at", "title": "Date de création", "width": 20},
        {"field": "updated_at", "title": "Date de modification", "width": 20},
        {"field": "projects", "title": "Projets", "width": 20},
    )
    # only exported when requested in `fields` (i.e. visible in the forms list), as some are costly to compute
    EXPORT_OPTIONAL_COLUMNS = (
        {"field": "instances_count", "title": "Enregistrement(s)", "width": 20},
        {"field": "instance_updated_at", "title": "Dernière soumission", "width": 20},
    )
    EXPORT_FILE_NAME = "forms"
    filter_backends = [DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible]

    def get_queryset(self):
        form_objects = Form.objects
        only_deleted = self.request.query_params.get("only_deleted")
        if only_deleted == "1":
            form_objects = Form.objects_only_deleted

        show_deleted = self.request.query_params.get("show_deleted")
        if show_deleted == "1":
            form_objects = Form.objects_include_deleted

        queryset = form_objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        ).filter_on_user_projects(self.request.user)
        org_unit_id = self.request.query_params.get("orgUnitId", None)
        if org_unit_id:
            queryset = queryset.filter(instances__org_unit__id=org_unit_id)

        planning_ids = self.request.query_params.get("planning", None)
        if planning_ids:
            queryset = queryset.filter(plannings__id__in=planning_ids.split(","))

        org_unit_type_ids = self.request.query_params.get("orgUnitTypeIds")
        if org_unit_type_ids:
            queryset = queryset.filter(org_unit_types__id__in=org_unit_type_ids.split(","))

        org_unit_group_ids = self.request.query_params.get("orgUnitGroupIds")
        if org_unit_group_ids:
            queryset = queryset.filter(org_unit_groups__id__in=org_unit_group_ids.split(","))

        projects_ids = self.request.query_params.get("projectsIds")
        if projects_ids:
            queryset = queryset.filter(projects__id__in=projects_ids.split(","))

        requested_fields = self.request.query_params.get("fields")
        if requested_fields and self._is_export():
            base_fields = [column["field"] for column in self.EXPORT_BASE_COLUMNS]
            requested_fields = ",".join([*requested_fields.split(","), *base_fields])

        is_request_from_manifest = self.request.path.endswith("/manifest/")
        default_order = "id" if is_request_from_manifest else "name"

        order = self.request.query_params.get("order", default_order).split(",")

        if is_field_referenced("has_mappings", requested_fields, order):
            mappings_exist = Mapping.objects.filter(form_id=OuterRef("pk"))
            queryset = queryset.annotate(has_mappings=Exists(mappings_exist))

        if is_field_referenced("has_attachments", requested_fields, order) and not is_request_from_manifest:
            attachment_exists = FormAttachment.objects.filter(form_id=OuterRef("pk"))
            queryset = queryset.annotate(has_attachments=Exists(attachment_exists))

        if not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
        else:
            profile = False

        if is_field_referenced("instance_updated_at", requested_fields, order) and not is_request_from_manifest:
            latest_instance = Instance.objects.filter(form=OuterRef("pk")).order_by("-updated_at")
            queryset = queryset.annotate(instance_updated_at=Subquery(latest_instance.values("updated_at")[:1]))

        enable_count = is_field_referenced("instances_count", requested_fields, order) and not is_request_from_manifest

        if enable_count:
            if profile and profile.org_units.exists():
                orgunits = OrgUnit.objects.hierarchy(profile.org_units.all())
                queryset = queryset.annotate(
                    instances_count=Count(
                        "instances",
                        filter=(
                            ~Q(instances__file="")
                            & ~Q(instances__device__test_device=True)
                            & ~Q(instances__deleted=True)
                            & Q(instances__org_unit__in=orgunits)
                        ),
                        distinct=True,
                    )
                )
            else:
                queryset = queryset.annotate(
                    instances_count=Count(
                        "instances",
                        filter=(
                            ~Q(instances__file="")
                            & ~Q(instances__device__test_device=True)
                            & ~Q(instances__deleted=True)
                        ),
                        distinct=True,
                    )
                )

        from_date = self.request.query_params.get("date_from", None)
        if from_date:
            queryset = queryset.filter(
                Q(instance_updated_at__gte=from_date) | Q(created_at__gte=from_date) | Q(updated_at__gte=from_date)
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

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        prefetch_fields = requested_fields
        if not prefetch_fields:
            serializer_default_fields = getattr(self.get_serializer_class().Meta, "default_fields", None)
            prefetch_fields = ",".join(serializer_default_fields) if serializer_default_fields else None

        def _wants(field_name):
            return is_field_referenced(field_name, prefetch_fields, order)

        if not is_request_from_manifest:
            prefetch_relations = []
            if _wants("projects") or _wants("project_ids"):
                prefetch_relations += [
                    "projects",
                    "projects__feature_flags",
                    Prefetch(
                        "projects__projectfeatureflags_set",
                        queryset=ProjectFeatureFlags.objects.select_related("featureflag"),
                    ),
                ]
            if _wants("org_unit_types") or _wants("org_unit_type_ids"):
                prefetch_relations += [
                    "org_unit_types",
                    "org_unit_types__reference_forms",
                    "org_unit_types__sub_unit_types",
                    "org_unit_types__allow_creating_sub_unit_types",
                ]
            if _wants("org_unit_groups") or _wants("org_unit_group_ids"):
                prefetch_relations.append("org_unit_groups")
            if _wants("reference_form_of_org_unit_types"):
                prefetch_relations.append("reference_of_org_unit_types")
            if prefetch_relations:
                queryset = queryset.prefetch_related(*prefetch_relations)

        # optimize latest version loading to not trigger a select n+1 on form_version
        if _wants("latest_form_version") or _wants("possible_fields_with_latest_version"):
            queryset = queryset.with_latest_version()

        # TODO: allow this only from a predefined list for security purposes

        queryset = queryset.order_by(*order)

        # Ensure duplicates are removed after all joins and annotations
        queryset = queryset.distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == "dropdown":
            return FormDropdownSerializer
        return FormSerializer

    @extend_schema(responses={200: FormDropdownSerializer(many=True)})
    @action(detail=False, methods=["get"], pagination_class=None)
    def dropdown(self, request: Request, *args, **kwargs):
        """
        Lightweight forms list for dropdowns.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def list(self, request: Request, *args, **kwargs):
        # TODO: use accept header to determine format - or at least the standard "format" parameter
        # DRF also provides a mechanic for custom renderer
        # see https://www.django-rest-framework.org/api-guide/renderers/
        csv_format = bool(request.query_params.get("csv"))
        xlsx_format = bool(request.query_params.get("xlsx"))

        if csv_format:
            return self.list_to_csv()
        if xlsx_format:
            return self.list_to_xlsx()

        return super().list(request, *args, **kwargs)

    def _is_export(self) -> bool:
        return bool(self.request.query_params.get("csv") or self.request.query_params.get("xlsx"))

    def _get_export_columns(self) -> list:
        requested_fields = self.request.query_params.get("fields")
        order = self.request.query_params.get("order", "name").split(",")
        optional_columns = [
            column
            for column in self.EXPORT_OPTIONAL_COLUMNS
            if is_field_referenced(column["field"], requested_fields, order)
        ]
        return [*self.EXPORT_BASE_COLUMNS, *optional_columns]

    def list_to_csv(self):
        columns = self._get_export_columns()
        response = StreamingHttpResponse(
            streaming_content=(iter_items(self.get_queryset(), Echo(), columns, self._row_getter(columns))),
            content_type=CONTENT_TYPE_CSV,
        )
        response["Content-Disposition"] = f"attachment; filename={self.EXPORT_FILE_NAME}.csv"

        return response

    def list_to_xlsx(self):
        columns = self._get_export_columns()
        response = HttpResponse(
            generate_xlsx("Forms", columns, self.get_queryset(), self._row_getter(columns)),
            content_type=CONTENT_TYPE_XLSX,
        )
        response["Content-Disposition"] = f"attachment; filename={self.EXPORT_FILE_NAME}.xlsx"

        return response

    @staticmethod
    def _get_export_value(form: Form, field: str):
        if field in ("org_unit_types", "org_unit_groups", "projects"):
            return ", ".join(related.name for related in getattr(form, field).all())
        if field in ("created_at", "updated_at", "instance_updated_at"):
            value = getattr(form, field)
            return timestamp_to_datetime(value.timestamp()) if value else None
        return getattr(form, field)

    def _row_getter(self, columns: list):
        def get_row(form: Form, **kwargs):
            return [self._get_export_value(form, column["field"]) for column in columns]

        return get_row

    def destroy(self, request, *args, **kwargs):
        original = get_object_or_404(Form, pk=self.kwargs["pk"])
        response = super(FormsViewSet, self).destroy(request, *args, **kwargs)
        destroyed_form = Form.objects_only_deleted.get(pk=original.id)
        log_modification(original, destroyed_form, FORM_API, user=request.user)
        return response

    @action(detail=True, methods=["get"])
    def manifest(self, request, *args, **kwargs):
        """Returns a xml manifest file in the openrosa format for the Form

        This is used for the mobile app to fetch the list of files attached to the Form
        see https://docs.getodk.org/openrosa-form-list/#the-manifest-document
        """
        form = self.get_object()
        return generate_manifest_for_form(form, request)

    @extend_schema(tags=["Enketo"])
    @action(detail=True, methods=["get"], permission_classes=[ReadOnly])
    def manifest_enketo(self, request, pk, *args, **kwargs):
        """Returns a xml manifest file in the openrosa format for the Form

        This is used by enketo to fetch the list of files attached to the Form
        see https://docs.getodk.org/openrosa-form-list/#the-manifest-document
        """
        enketo_secret = enketo_settings("ENKETO_SIGNING_SECRET")
        if verify_signed_url(request, enketo_secret):
            app_id = AppIdSerializer(data=request.query_params).get_app_id(raise_exception=True)
            queryset = Form.objects.filter(
                projects__app_id=app_id
            )  # Not using the default queryset because there's no auth
            form = get_object_or_404(queryset, pk=pk)
            return generate_manifest_for_form(form, request)

        return HttpResponse(
            status=status.HTTP_400_BAD_REQUEST,
            content_type="text/xml",
            headers={
                "X-OpenRosa-Version": "1.0",
            },
            content="<error>Invalid URL signature</error>",
        )
