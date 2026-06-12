from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from iaso.api.common import ModelSerializer, TimestampField
from iaso.models import Form, OrgUnitType, Project


class NestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "color",
        ]


class NestedFormSerializer(ModelSerializer):
    projects = NestedProjectSerializer(read_only=True, many=True)

    class Meta:
        model = Form
        fields = ["id", "form_id", "created_at", "updated_at", "projects"]


class NestedSubUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "depth", "created_at", "updated_at"]


class OrgUnitTypeListSerializer(DynamicFieldsModelSerializerBackwardCompatible):
    projects = NestedProjectSerializer(many=True, read_only=True)
    sub_unit_types = NestedSubUnitTypeSerializer(many=True, read_only=True, allow_empty=True)
    allow_creating_sub_unit_types = NestedSubUnitTypeSerializer(many=True, read_only=True, allow_empty=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    units_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrgUnitType
        fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "projects",
            "sub_unit_types",
            "allow_creating_sub_unit_types",
            "created_at",
            "updated_at",
            "units_count",
        ]
        default_fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "projects",
            "sub_unit_types",
            "created_at",
            "updated_at",
            "units_count",
        ]

    @extend_schema_field(serializers.IntegerField(allow_null=True, read_only=True))
    def get_units_count(self, obj: OrgUnitType):
        return len(obj.prefetched_org_units)
