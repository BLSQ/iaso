from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.api.missions.serializers.update.mission_entity_type import MissionEntityTypeUpdateSerializer
from iaso.api.missions.serializers.update.mission_form import MissionFormUpdateSerializer
from iaso.api.missions.serializers.update.mission_org_unit_type import MissionOrgUnitTypeUpdateSerializer
from iaso.models import MissionEntityType, MissionForm, MissionOrgUnitType


class MissionPolymorphicUpdateSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormUpdateSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeUpdateSerializer,
        MissionEntityType: MissionEntityTypeUpdateSerializer,
    }
