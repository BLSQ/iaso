import typing

from django.db.models import BooleanField, Count, TextField, Value
from django.db.models.expressions import Case, When
from django.db.models.functions import Concat
from rest_framework import exceptions, parsers, serializers
from rest_framework.fields import Field

from iaso.api.query_params import APP_ID
from iaso.models import FeatureFlag, Form, FormVersion, Project
from iaso.odk import parsing, validate_xls_form

from .common import DynamicFieldsModelSerializer, ModelViewSet, TimestampField
from .forms import HasFormPermission
from .serializers import AppIdSerializer


# noinspection PyMethodMayBeStatic
class FormVersionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = FormVersion
        default_fields = [
            "id",
            "version_id",
            "form_id",
            "form_name",
            "full_name",  # model annotation
            "mapped",  # model annotation
            "xls_file",
            "file",
            "created_at",
            "updated_at",
            "start_period",
            "end_period",
            "mapping_versions",
        ]
        fields = [
            "id",
            "version_id",
            "form_id",
            "form_name",
            "full_name",  # model annotation
            "mapped",  # model annotation
            "xls_file",
            "file",
            "descriptor",
            "created_at",
            "updated_at",
            "start_period",
            "end_period",
            "mapping_versions",
            "possible_fields",
        ]
        read_only_fields = [
            "id",
            "form_name",
            "version_id",
            "full_name",
            "mapped",
            "file",
            "created_at",
            "updated_at",
            "descriptor",
            "possible_fields",
        ]

    form_id: Field = serializers.PrimaryKeyRelatedField(source="form", queryset=Form.objects.all())
    form_name = serializers.SerializerMethodField()
    xls_file = serializers.FileField(required=False, allow_empty_file=False)  # field is not required in model
    mapped = serializers.BooleanField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    descriptor = serializers.SerializerMethodField()
    mapping_versions = serializers.SerializerMethodField()
    start_period = serializers.CharField(required=False, default=None)
    end_period = serializers.CharField(required=False, default=None)

    def get_form_name(self, form_version):
        return form_version.form.name

    def get_descriptor(self, form_version):
        return form_version.get_or_save_form_descriptor()

    @staticmethod
    def get_mapping_versions(obj: FormVersion):
        return [f.as_dict() for f in obj.mapping_versions.all()]

    def validate(self, data: typing.MutableMapping):
        # TODO: validate start en end period (is a period and start before end)
        form = data["form"]

        # validate form (access check)
        permission_checker = HasFormPermission()
        if not permission_checker.has_object_permission(self.context["request"], self.context["view"], form):
            raise serializers.ValidationError({"form_id": "Invalid form id"})
        if self.context["request"].method == "PUT" or self.context["request"].method == "PATCH":
            # if update skip the rest of check
            return data

        content = data["xls_file"].read()
        named_buffer = parsing.NamedBytesIO(content, name=data["xls_file"].name)
        validation_errors = validate_xls_form(named_buffer)
        if len(validation_errors):
            # TODO: translate the error message
            # keep xls_file empty to highlight the input in the UI
            raise serializers.ValidationError({"xls_file": "", "xls_file_validation_errors": validation_errors})

        data["xls_file"].seek(0)

        # handle xls to xml conversion
        try:
            previous_form_version = FormVersion.objects.latest_version(form)
            content = data["xls_file"].read()
            named_buffer = parsing.NamedBytesIO(content, name=data["xls_file"].name)
            survey = parsing.parse_xls_form(
                named_buffer,
                previous_version=previous_form_version.version_id if previous_form_version is not None else None,
            )
        except parsing.ParsingError as e:
            raise serializers.ValidationError({"xls_file": str(e)})

        # validate that form_id stays constant across versions
        if form.form_id is not None and survey.form_id != form.form_id:
            raise serializers.ValidationError({"xls_file": "Form id should stay constant across form versions."})

        # validate form_id (from XLS file) uniqueness across account
        if Form.objects.exists_with_same_version_id_within_projects(form, survey.form_id):
            raise serializers.ValidationError({"xls_file": "The form_id is already used in another form."})

        data["survey"] = survey

        return data

    def create(self, validated_data):
        form = validated_data.pop("form")
        survey = validated_data.pop("survey")
        try:
            return FormVersion.objects.create_for_form_and_survey(form=form, survey=survey, **validated_data)
        except Exception as e:
            # putting the error in an array to prevent front-end crash
            raise exceptions.ValidationError({"xls_file": [e]})

    def update(self, form_version, validated_data):
        form_version.start_period = validated_data.pop("start_period", None)
        form_version.end_period = validated_data.pop("end_period", None)
        form_version.save()
        return form_version


class HasFormVersionPermission(HasFormPermission):
    def has_object_permission(self, request, view, obj) -> bool:
        if not self.has_permission(request, view):
            return False

        ok_forms = Form.objects_include_deleted.filter_for_user_and_app_id(
            request.user, request.query_params.get(APP_ID)
        )

        return ok_forms.filter(id=obj.form_id).exists()


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
            queryset = queryset.filter(form__name__icontains=search_name)
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

        queryset = queryset.order_by(*orders)

        return queryset
