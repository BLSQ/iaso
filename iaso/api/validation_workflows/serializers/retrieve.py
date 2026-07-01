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
    updated_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
    created_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
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
            "versions",
        ]
