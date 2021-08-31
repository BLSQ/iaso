import typing
from rest_framework import serializers, parsers, permissions

from iaso.models import Form, FormVersion
from django.db.models.functions import Concat
from django.db.models import Value, Count
from django.db.models import BooleanField
from django.db.models.expressions import Case, When

from iaso.odk import parsing
from .common import ModelViewSet, TimestampField, DynamicFieldsModelSerializer, HasPermission
from .forms import HasFormPermission


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
        ]

    form_id = serializers.PrimaryKeyRelatedField(source="form", queryset=Form.objects.all())
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
        if self.context["request"].method == "PUT":
            # Skip validation for update, permission in that case is checked via the get_queryset.
            return data
        form = data["form"]
        # validate form (access check)
        permission_checker = HasFormPermission()
        if not permission_checker.has_object_permission(self.context["request"], self.context["view"], form):
            raise serializers.ValidationError({"form_id": "Invalid form id"})

        # handle xls to xml conversion
        try:
            previous_form_version = FormVersion.objects.latest_version(form)
            survey = parsing.parse_xls_form(
                data["xls_file"],
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

        return FormVersion.objects.create_for_form_and_survey(form=form, survey=survey, **validated_data)

    def update(self, form_version, validated_data):
        form_version.start_period = validated_data.pop("start_period", None)
        form_version.end_period = validated_data.pop("end_period", None)
        form_version.save()
        return form_version


class FormVersionsViewSet(ModelViewSet):
    """Form versions API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/formversions/
    GET /api/formversions/<id>
    POST /api/formversions/
    PUT /api/formversions/<id>  -- can only update start_period and end_period
    """

    serializer_class = FormVersionSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_forms")]
    results_key = "form_versions"
    queryset = FormVersion.objects.all()
    parser_classes = (parsers.MultiPartParser, parsers.JSONParser)
    http_method_names = ["get", "put", "post", "head", "options", "trace"]

    def get_queryset(self):
        orders = self.request.query_params.get("order", "full_name").split(",")
        mapped_filter = self.request.query_params.get("mapped", "")

        profile = self.request.user.iaso_profile
        queryset = FormVersion.objects.filter(form__projects__account=profile.account)

        search_name = self.request.query_params.get("search_name", None)
        if search_name:
            queryset = queryset.filter(form__name__icontains=search_name)
        form_id = self.request.query_params.get("form_id", None)
        if form_id:
            queryset = queryset.filter(form__id=form_id)

        queryset = queryset.annotate(full_name=Concat("form__name", Value(" - V"), "version_id"))

        queryset = queryset.annotate(mapping_versions_count=Count("mapping_versions"))

        queryset = queryset.annotate(
            mapped=Case(When(mapping_versions_count__gt=0, then=True), default=False, output_field=BooleanField())
        )

        if mapped_filter:
            queryset = queryset.filter(mapped=(mapped_filter == "true"))

        queryset = queryset.order_by(*orders)

        return queryset
