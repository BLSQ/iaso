from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.models import MissionEntityType, MissionForm, MissionOrgUnitType

from .mission_entity_type import MissionEntityTypeCreateSerializer
from .mission_form import MissionFormCreateSerializer
from .mission_org_unit_type import MissionOrgUnitTypeCreateSerializer


class MissionPolymorphicCreateSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormCreateSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeCreateSerializer,
        MissionEntityType: MissionEntityTypeCreateSerializer,
    }
    remove_resource_type_field_from_representation = True
