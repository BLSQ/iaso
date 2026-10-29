import typing

from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, OrgUnitType


class OrgUnitTreeNestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "category"]
        read_only_fields = fields


class OrgUnitBuildTreeSerializer(ModelSerializer):
    depth = serializers.IntegerField(read_only=True)
    org_unit_type = OrgUnitTreeNestedOrgUnitTypeSerializer(read_only=True, allow_null=True)
    has_geo_json = serializers.BooleanField(read_only=True)
    has_location = serializers.BooleanField(read_only=True)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent", "depth", "org_unit_type", "has_geo_json", "has_location"]
        read_only_fields = fields


class OrgUnitTreeSerializer(OrgUnitBuildTreeSerializer):
    """
    This serializer has been built only for swagger compliance
    """

    children = serializers.SerializerMethodField()

    class Meta(OrgUnitBuildTreeSerializer.Meta):
        model = OrgUnit
        fields = OrgUnitBuildTreeSerializer.Meta.fields + ["children"]
        read_only_fields = fields

    @extend_schema_field(
        lazy_serializer("iaso.api.microplanning.serializers.org_unit_tree.OrgUnitTreeSerializer")(many=True)
    )
    def get_children(self, obj: OrgUnit) -> typing.List[dict]:
        return typing.cast(
            typing.List[dict], typing.cast(object, OrgUnitTreeSerializer(obj.descendants().all(), many=True).data)
        )
