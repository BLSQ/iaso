from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, OrgUnitType, PlanningConfig


class PlanningConfigNestedOrgUnitSerializer(ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ("id", "name")
        read_only_fields = fields


class PlanningConfigNestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ("id", "name")
        read_only_fields = fields


class PlanningConfigSerializer(ModelSerializer):
    org_unit_types = PlanningConfigNestedOrgUnitTypeSerializer(many=True, allow_null=True, allow_empty=True)
    org_unit_groups = PlanningConfigNestedOrgUnitSerializer(many=True, allow_null=True, allow_empty=True)

    class Meta:
        model = PlanningConfig
        fields = ("level", "org_unit_types", "org_unit_groups")
        read_only_fields = fields
