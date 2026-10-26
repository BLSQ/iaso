from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.models import MissionEntityType, MissionForm, MissionOrgUnitType

from .mission_entity_type import MissionEntityTypeRetrieveSerializer
from .mission_form import MissionFormRetrieveSerializer
from .mission_org_unit_type import MissionOrgUnitTypeRetrieveSerializer


class MissionPolymorphicRetrieveSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormRetrieveSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeRetrieveSerializer,
        MissionEntityType: MissionEntityTypeRetrieveSerializer,
    }
