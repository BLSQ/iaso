from typing import Union

from rest_framework import serializers

from iaso.models import OrgUnit


class OrgUnitTreeSerializer(serializers.ModelSerializer):
    has_children = serializers.SerializerMethodField()
    org_unit_type_short_name = serializers.SerializerMethodField()

    @classmethod
    def get_has_children(cls, org_unit: OrgUnit) -> bool:
        return org_unit.children_count > 0

    def get_org_unit_type_short_name(self, org_unit: OrgUnit) -> Union[str, None]:
        return org_unit.org_unit_type.short_name if org_unit.org_unit_type else None

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "validation_status",
            "has_children",
            "org_unit_type_id",
            "org_unit_type_short_name",
        ]
