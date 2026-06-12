from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitType


class OrgUnitTypeHierarchySerializer(ModelSerializer):
    """Lightweight serializer for org unit type hierarchy with recursive sub_unit_types"""

    sub_unit_types = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]
        read_only_fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]

    # todo : make it recursive in the swagger
    @extend_schema_field(serializers.ListField(allow_empty=True))
    def get_sub_unit_types(self, obj):
        """Recursively serialize sub_unit_types to build complete hierarchy"""
        sub_types = obj.sub_unit_types.all()
        return OrgUnitTypeHierarchySerializer(sub_types, many=True, context=self.context).data
