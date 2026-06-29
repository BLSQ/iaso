from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Form, ValidationWorkflow


class NestedFormSerializer(ModelSerializer):
    label = serializers.CharField(read_only=True, source="name")

    class Meta:
        model = Form
        fields = ["id", "label"]


class VersionSlugRelatedField(serializers.SlugRelatedField):
    def to_representation(self, value):
        value = super().to_representation(value)
        if value:
            return str(value)
        return value


class ValidationWorkflowRetrieveSerializer(ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    latest_version_updated_at = serializers.SerializerMethodField(read_only=True)
    latest_version_created_at = serializers.SerializerMethodField(read_only=True)
    versions = VersionSlugRelatedField(slug_field="version", read_only=True, many=True)

    forms = NestedFormSerializer(many=True, read_only=True, source="form_set", allow_null=True)

    class Meta:
        model = ValidationWorkflow
        fields = [
            "slug",
            "name",
            "description",
            "forms",
            "updated_by",
            "created_by",
            "created_at",
            "updated_at",
            "latest_version_created_at",
            "latest_version_updated_at",
            "versions",
        ]

    @extend_schema_field(UserDisplayNameField(allow_null=True, allow_blank=True, required=False, read_only=True))
    def get_created_by(self, obj):
        return UserDisplayNameField(allow_null=True, allow_blank=True, required=False).to_representation(
            obj.prefetched_versions[0].created_by if obj.prefetched_versions else None
        )

    @extend_schema_field(UserDisplayNameField(allow_null=True, allow_blank=True, required=False, read_only=True))
    def get_updated_by(self, obj):
        return UserDisplayNameField(allow_null=True, allow_blank=True, required=False).to_representation(
            obj.prefetched_versions[0].updated_by if obj.prefetched_versions else None
        )

    @extend_schema_field(serializers.DateTimeField(allow_null=True, required=False, read_only=True))
    def get_latest_version_updated_at(self, obj):
        return serializers.DateTimeField(allow_null=True, required=False, read_only=True).to_representation(
            obj.prefetched_versions[0].updated_at if obj.prefetched_versions else None
        )

    @extend_schema_field(serializers.DateTimeField(allow_null=True, required=False, read_only=True))
    def get_latest_version_created_at(self, obj):
        return serializers.DateTimeField(allow_null=True, required=False, read_only=True).to_representation(
            obj.prefetched_versions[0].created_at if obj.prefetched_versions else None
        )
