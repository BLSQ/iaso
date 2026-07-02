from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.models import MissionForm
from iaso.models.microplanning import MissionOrgUnitType

from .mission_form import MissionFormListSerializer
from .mission_org_unit_type import MissionOrgUnitTypeListSerializer


class MissionPolymorphicListSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: MissionFormListSerializer,
        MissionOrgUnitType: MissionOrgUnitTypeListSerializer,
    }
