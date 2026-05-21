from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, OrgUnit, OrgUnitChangeRequest, ValidationNode


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
    org_unit = NestedOrgUnitSerializer(read_only=True)
    history = serializers.SerializerMethodField()
    org_unit_validation_status = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = [
            "id",
            "general_validation_status",
            "org_unit_validation_status",
            "file_url",
            "file_content",
            "org_unit",
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

    @extend_schema_field(serializers.ChoiceField(choices=OrgUnitChangeRequest.Statuses, allow_blank=True))
    def get_org_unit_validation_status(self, obj):
        if obj.org_unit and getattr(obj.org_unit, "prefetched_org_unit_changerequest_set", None):
            return next(iter(obj.org_unit.prefetched_org_unit_changerequest_set)).status
        return ""
