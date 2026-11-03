import typing

from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, OrgUnitType


class OrgUnitTreeWithGeomNestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "category"]
        read_only_fields = fields


class OrgUnitBuildTreeWithGeomSerializer(ModelSerializer):
    depth = serializers.IntegerField(read_only=True)
    org_unit_type = OrgUnitTreeWithGeomNestedOrgUnitTypeSerializer(read_only=True, allow_null=True)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent", "geom", "simplified_geom", "location", "depth", "org_unit_type"]
        read_only_fields = fields


class OrgUnitTreeWithGeomSerializer(OrgUnitBuildTreeWithGeomSerializer):
    """
    This serializer has been built only for swagger compliance
    """

    children = serializers.SerializerMethodField()

    class Meta(OrgUnitBuildTreeWithGeomSerializer.Meta):
        model = OrgUnit
        fields = OrgUnitBuildTreeWithGeomSerializer.Meta.fields + ["children"]
        read_only_fields = fields

    @extend_schema_field(
        lazy_serializer("iaso.api.microplanning.serializers.org_unit_tree_geom.OrgUnitBuildTreeWithGeomSerializer")(
            many=True
        )
    )
    def get_children(self, obj: OrgUnit) -> list[dict]:
        return typing.cast(
            list[dict], typing.cast(object, OrgUnitBuildTreeWithGeomSerializer(obj.descendants().all(), many=True).data)
        )
