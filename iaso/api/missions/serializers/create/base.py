from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.models import MissionForm
from iaso.models.microplanning import MissionOrgUnitType

from .mission_form import MissionFormCreateSerializer
from .mission_org_unit_type import MissionOrgUnitTypeCreateSerializer


class MissionPolymorphicCreateSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormCreateSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeCreateSerializer,
    }
    remove_resource_type_field_from_representation = True
