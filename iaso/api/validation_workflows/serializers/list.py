from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import ValidationWorkflow


class ValidationWorkflowListSerializer(ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    form_count = serializers.IntegerField(read_only=True)
    latest_version_updated_at = serializers.SerializerMethodField(read_only=True)
    latest_version_created_at = serializers.SerializerMethodField(read_only=True)
    current_version = serializers.CharField(read_only=True, allow_null=False, allow_blank=False)

    class Meta:
        model = ValidationWorkflow
        fields = [
            "slug",
            "name",
            "form_count",
            "current_version",
            "updated_by",
            "created_by",
            "created_at",
            "updated_at",
            "latest_version_created_at",
            "latest_version_updated_at",
        ]
        extra_kwargs = {"slug": {"required": True}}

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
