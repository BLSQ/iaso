import typing

from copy import copy

from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializer
from hat.audit.models import FORM_API, log_modification
from iaso.api.common import ModelSerializer, TimestampField
from iaso.api.form_predefined_filters.serializers import FormPredefinedFilterSerializer
from iaso.api.projects import ProjectSerializer
from iaso.models import EntityDuplicateAnalyzis, Form, FormVersion, OrgUnitType, Project


class FormVersionNestedSerializer(ModelSerializer):
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    class Meta:
        model = FormVersion
        fields = ["id", "version_id", "file", "xls_file", "created_at", "updated_at"]


class FormSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Form
        default_fields = [
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
            "deleted_at",
            "derived",
            "fields",
            "label_keys",
            "reference_form_of_org_unit_types",
            "legend_threshold",
            "change_request_mode",
            "has_mappings",
            "validation_workflow",
        ]
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
            "deleted_at",
            "derived",
            "possible_fields",
            "label_keys",
            "predefined_filters",
            "has_attachments",
            "reference_form_of_org_unit_types",
            "legend_threshold",
            "change_request_mode",
            "has_mappings",
            "possible_fields_with_latest_version",
            "validation_workflow",
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
            "possible_fields",
            "fields",
            "has_attachments",
            "reference_form_of_org_unit_types",
            "has_mappings",
        ]

    org_unit_types = serializers.SerializerMethodField()
    org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="org_unit_types", many=True, allow_empty=True, queryset=OrgUnitType.objects.all()
    )
    projects = ProjectSerializer(read_only=True, many=True)
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects", many=True, allow_empty=False, queryset=Project.objects.all()
    )
    latest_form_version = FormVersionNestedSerializer(source="latest_version", required=False)
    instances_count = serializers.IntegerField(read_only=True)
    instance_updated_at = TimestampField(read_only=True)
    predefined_filters = FormPredefinedFilterSerializer(many=True, read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    deleted_at = TimestampField(allow_null=True, required=False)
    has_attachments = serializers.SerializerMethodField()
    reference_form_of_org_unit_types = serializers.SerializerMethodField()
    has_mappings = serializers.BooleanField(read_only=True)
    possible_fields_with_latest_version = serializers.SerializerMethodField()

    @staticmethod
    def get_org_unit_types(obj: Form):
        return [t.as_dict() for t in obj.org_unit_types.all()]

    @staticmethod
    def get_reference_form_of_org_unit_types(obj: Form):
        return [org_unit.as_dict() for org_unit in obj.reference_of_org_unit_types.all()]

    @staticmethod
    def get_has_attachments(obj: Form):
        if hasattr(obj, "has_attachments"):
            return obj.has_attachments
        return obj.attachments.exists()

    @staticmethod
    def get_possible_fields_with_latest_version(obj: Form):
        possible_fields = [
            field for field in obj.possible_fields if field["type"] in EntityDuplicateAnalyzis.SUPPORTED_FIELD_TYPES
        ]

        latest_version = obj.latest_version
        if not latest_version:
            return possible_fields

        # Get the field names from the latest version
        latest_version_fields = set(question["name"] for question in latest_version.questions_by_name().values())

        # Add a flag to each possible field indicating if it's part of the latest version
        return [{**field, "is_latest": field["name"] in latest_version_fields} for field in possible_fields]

    def validate(self, data: typing.Mapping):
        # validate projects (access check)
        if "projects" in data:
            for project in data["projects"]:
                if self.context["request"].user.iaso_profile.account != project.account:
                    raise serializers.ValidationError({"project_ids": "Invalid project ids"})

            # validate org_unit_types against projects
            allowed_org_unit_types = [ut for p in data["projects"] for ut in p.unit_types.all()]
            if len(set(data["org_unit_types"]) - set(allowed_org_unit_types)) > 0:
                raise serializers.ValidationError({"org_unit_type_ids": "Invalid org unit type ids"})

        # If the period type is None, some period-specific fields must have specific values
        if "period_type" in data:
            tracker_errors = {}
            if data["period_type"] is None:
                if data["periods_before_allowed"] != 0:
                    tracker_errors["periods_before_allowed"] = "Should be 0 when period type is not specified"
                if data["periods_after_allowed"] != 0:
                    tracker_errors["periods_after_allowed"] = "Should be 0 when period type is not specified"
            else:
                before = data.get("periods_before_allowed", 0)
                after = data.get("periods_after_allowed", 0)
                if before + after < 1:
                    tracker_errors["periods_allowed"] = (
                        "periods_before_allowed + periods_after_allowed should be greater than or equal to 1"
                    )
            if tracker_errors:
                raise serializers.ValidationError(tracker_errors)
        return data

    def update(self, form, validated_data):
        original = copy(form)
        form = super(FormSerializer, self).update(form, validated_data)
        log_modification(original, form, FORM_API, user=self.context["request"].user)
        return form

    def create(self, validated_data):
        form = super(FormSerializer, self).create(validated_data)
        log_modification(None, form, FORM_API, user=self.context["request"].user)
        return form
