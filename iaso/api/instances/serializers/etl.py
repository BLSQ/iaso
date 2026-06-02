from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, ValidationNode


class NestedHistorySerializer(ModelSerializer):
    level = serializers.CharField(read_only=True, source="node.name")
    created_by = UserDisplayNameField()
    updated_by = UserDisplayNameField(allow_null=True)

    class Meta:
        model = ValidationNode
        fields = [
            "level",
            "created_at",
            "updated_at",
            "status",
            "comment",
            "updated_by",
            "created_by",
        ]


class ETLInstanceListSerializer(ModelSerializer):
    file_content = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    history = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = [
            "id",
            "general_validation_status",
            "file_url",
            "file_content",
            "history",
            "form_id",
        ]
        extra_kwargs = {
            "id": {"read_only": True},
            "general_validation_status": {"read_only": True, "allow_blank": True},
            "form_id": {"read_only": True},
        }

    @extend_schema_field(serializers.JSONField)
    def get_file_content(self, obj):
        return obj.get_and_save_json_of_xml()

    @extend_schema_field(serializers.URLField(allow_null=True, allow_blank=True))
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

    @extend_schema_field(NestedHistorySerializer(many=True))
    def get_history(self, obj):
        return NestedHistorySerializer(obj.prefeteched_validationnode_set, many=True).data
