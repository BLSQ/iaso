from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.models import MissionForm
from iaso.models.microplanning import MissionOrgUnitType

from .mission_form import MissionFormRetrieveSerializer
from .mission_org_unit_type import MissionOrgUnitTypeRetrieveSerializer


class MissionPolymorphicRetrieveSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormRetrieveSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeRetrieveSerializer,
    }
