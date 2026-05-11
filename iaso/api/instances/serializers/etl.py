from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Instance, OrgUnit


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


class ETLInstanceListSerializer(ModelSerializer):
    file_content = serializers.SerializerMethodField()
    file_url = serializers.URLField(source="file.url", read_only=True)
    org_unit = NestedOrgUnitSerializer()

    class Meta:
        model = Instance
        fields = [
            "id",
            "general_validation_status",
            "file_url",
            "file_content",
            "org_unit",
        ]

    @extend_schema_field(serializers.JSONField)
    def get_file_content(self, obj):
        return obj.get_and_save_json_of_xml()
