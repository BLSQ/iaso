from typing import Optional

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.api.validation_workflows.constants import DEFAULT_COLOR, MOBILE_STATUS_TO_COLOR
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, ValidationNode
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


class NestedHistorySerializer(ModelSerializer):
    updated_at = TimestampField()
    created_at = TimestampField()
    color = serializers.SerializerMethodField(read_only=True)
    level = serializers.CharField(read_only=True, source="node.name")
    created_by = UserDisplayNameField()
    updated_by = UserDisplayNameField()

    class Meta:
        model = ValidationNode
        fields = [
            "level",
            "color",
            "created_at",
            "updated_at",
            "status",
            "comment",
            "updated_by",
            "created_by",
        ]

    @extend_schema_field(serializers.ChoiceField(choices=list(MOBILE_STATUS_TO_COLOR.values()) + [DEFAULT_COLOR]))
    def get_color(self, obj):
        return MOBILE_STATUS_TO_COLOR.get(obj.status, DEFAULT_COLOR)


class MobileValidationWorkflowListSerializer(ModelSerializer):
    instance_id = serializers.CharField(read_only=True, source="uuid")
    created_at = TimestampField(read_only=True)
    history = serializers.SerializerMethodField(read_only=True)
    validation_status = serializers.CharField(read_only=True, source="general_validation_status")
    rejection_comment = serializers.SerializerMethodField(read_only=True)
    updated_at = serializers.SerializerMethodField(label="Timestamp of the last update (history)", read_only=True)
    name = serializers.CharField(read_only=True, source="form.name")
    display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Instance
        fields = [
            "instance_id",
            "name",
            "display_name",
            "validation_status",
            "rejection_comment",
            "created_at",
            "updated_at",
            "history",
        ]

    @extend_schema_field({"type": "string", "nullable": True})
    def get_rejection_comment(self, obj):
        if obj.general_validation_status == ValidationWorkflowArtefactStatus.REJECTED:
            return (
                obj.validationnode_set.filter(status=ValidationNodeStatus.REJECTED)
                .only("status", "comment")
                .first()
                .comment
            )
        return None

    @extend_schema_field(NestedHistorySerializer(many=True))
    def get_history(self, obj):
        return NestedHistorySerializer(
            obj.get_all_validation_nodes().select_related("created_by", "updated_by", "node"), many=True
        ).data

    @extend_schema_field({"type": "integer", "format": "int64", "nullable": True})
    def get_updated_at(self, obj):
        updated_at = getattr(obj.validationnode_set.all().order_by("-updated_at").first(), "updated_at", None)
        return updated_at.timestamp() if updated_at else None

    @extend_schema_field({"type": "string", "nullable": True})
    def get_display_name(self, obj: Instance) -> Optional[str]:
        form = obj.form
        label_keys = form.label_keys
        if not label_keys or not obj.json:
            return None
        values = [str(obj.json[k]) if k in obj.json else None for k in label_keys]
        return " ".join([x for x in values if x is not None])
