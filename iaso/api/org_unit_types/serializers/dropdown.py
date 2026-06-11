from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitType


class OrgUnitTypesDropdownSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth", "sub_unit_types"]
        read_only_fields = ["id", "name", "depth", "sub_unit_types"]
