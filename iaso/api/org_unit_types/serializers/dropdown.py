from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitType


class NestedSubTypeSerializer(ModelSerializer):
    value = serializers.IntegerField(source="id", read_only=True)
    label = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "value", "label", "depth", "short_name"]
        extra_kwargs = {
            "id": {"read_only": True},
            "name": {"read_only": True},
            "short_name": {"read_only": True},
            "depth": {"read_only": True},
        }


class OrgUnitTypesDropdownSerializer(DynamicFieldsModelSerializerBackwardCompatible):
    value = serializers.IntegerField(source="id", read_only=True)
    label = serializers.CharField(source="name", read_only=True)
    sub_unit_types = NestedSubTypeSerializer(many=True, read_only=True, allow_empty=True)

    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "value", "label", "depth", "sub_unit_types"]
        default_fields = ["value", "label", "depth", "sub_unit_types"]
        extra_kwargs = {
            "id": {"read_only": True},
            "name": {"read_only": True},
            "short_name": {"read_only": True},
            "depth": {"read_only": True},
        }
