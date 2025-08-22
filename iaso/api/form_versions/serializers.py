import typing

from django.contrib.auth.models import User
from rest_framework import exceptions, serializers
from rest_framework.fields import Field

from iaso.api.common import DynamicFieldsModelSerializer, TimestampField
from iaso.api.forms import HasFormPermission
from iaso.models import Form, FormVersion
from iaso.odk import parsing, validate_xls_form


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForFormVersions"


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
            "md5",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
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
            "md5",
            "descriptor",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
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
            "md5",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
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
    created_by = UserNestedSerializer(required=False)
    updated_by = UserNestedSerializer(required=False)

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

        validation_errors = validate_xls_form(data["xls_file"])

        if len(validation_errors):
            # TODO: translate the error message
            # keep xls_file empty to highlight the input in the UI
            raise serializers.ValidationError({"xls_file": "", "xls_file_validation_errors": validation_errors})

        data["xls_file"].seek(0)

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
        user = self.context["request"].user
        validated_data["created_by"] = user
        validated_data["updated_by"] = user
        try:
            return FormVersion.objects.create_for_form_and_survey(form=form, survey=survey, **validated_data)
        except Exception as e:
            # putting the error in an array to prevent front-end crash
            raise exceptions.ValidationError({"xls_file": [e]})

    def update(self, form_version, validated_data):
        form_version.start_period = validated_data.pop("start_period", None)
        form_version.end_period = validated_data.pop("end_period", None)
        form_version.updated_by = self.context["request"].user
        form_version.save()
        return form_version
