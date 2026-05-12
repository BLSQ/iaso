from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Instance, OrgUnit, ValidationNode
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


class NestedOrgUnitSerializer(ModelSerializer):
    org_unit_type_name = serializers.CharField(read_only=True, source="org_unit_type.name")
    latitude = serializers.FloatField(read_only=True, source="location.y")
    longitude = serializers.FloatField(read_only=True, source="location.x")
    altitude = serializers.FloatField(read_only=True, source="location.z")

    class Meta:
        model = OrgUnit
        fields = [
            "name",
            "id",
            "parent_id",
            "org_unit_type_id",
            "org_unit_type_name",
            "validation_status",
            "created_at",
            "updated_at",
            "latitude",
            "longitude",
            "altitude",
            "aliases",
        ]
        extra_kwargs = {
            "name": {"read_only": True},
            "id": {"read_only": True},
            "parent_id": {"read_only": True},
            "org_unit_type_id": {"read_only": True},
            "validation_status": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "aliases": {"read_only": True},
        }


class NestedHistorySerializer(ModelSerializer):
    validation_status = serializers.SerializerMethodField()
    submitted_at = serializers.DateTimeField(read_only=True, source="created_at")
    last_updated = serializers.SerializerMethodField()

    class Meta:
        model = ValidationNode
        fields = ["submitted_at", "last_updated", "validation_status"]

    @extend_schema_field(serializers.DateTimeField)
    def get_last_updated(self, obj):
        instance = self._get_instance(obj)
        nodes = instance.prefetched_validation_nodes
        filtered_nodes = [n for n in nodes if n.created_at >= obj.created_at]
        if obj.next_created_at:
            filtered_nodes = [n for n in filtered_nodes if n.created_at < obj.next_created_at]
        updated_at_list = [n.updated_at for n in filtered_nodes]

        return max(updated_at_list)

    def _get_instance(self, obj):
        if "instance" in self.context:
            instance = self.context.get("instance")
        else:
            instance = obj.instance
        return instance

    @extend_schema_field(serializers.ChoiceField(choices=ValidationWorkflowArtefactStatus.choices))
    def get_validation_status(self, obj):
        instance = self._get_instance(obj)

        if not obj.next_created_at:
            return instance.general_validation_status

        nodes = instance.prefetched_validation_nodes
        rejected_nodes = [
            n
            for n in nodes
            if n.created_at >= obj.created_at
            and n.created_at < obj.next_created_at
            and n.status == ValidationNodeStatus.REJECTED
        ]
        if len(rejected_nodes):
            return ValidationWorkflowArtefactStatus.REJECTED
        return ValidationWorkflowArtefactStatus.PENDING


class ETLInstanceListSerializer(ModelSerializer):
    file_content = serializers.SerializerMethodField()
    file_url = serializers.URLField(source="file.url", read_only=True)
    org_unit = NestedOrgUnitSerializer(read_only=True)
    history = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = ["id", "general_validation_status", "file_url", "file_content", "org_unit", "history", "form_id"]
        extra_kwargs = {
            "id": {"read_only": True},
            "general_validation_status": {"read_only": True, "allow_blank": True},
            "form_id": {"read_only": True},
        }

    @extend_schema_field(serializers.JSONField)
    def get_file_content(self, obj):
        return obj.get_and_save_json_of_xml()

    @extend_schema_field(NestedHistorySerializer(many=True))
    def get_history(self, obj):
        nodes = obj.prefetched_submission_nodes
        return NestedHistorySerializer(nodes, many=True, context={**self.context, "instance": obj}).data
