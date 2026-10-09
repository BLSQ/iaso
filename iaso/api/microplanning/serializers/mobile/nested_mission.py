from collections.abc import Mapping

from rest_framework import serializers
from rest_polymorphic.serializers import PolymorphicSerializer

from iaso.api.common import ModelSerializer
from iaso.models import (
    EntityType,
    Form,
    MissionEntityType,
    MissionForm,
    MissionFormThroughForm,
    MissionOrgUnitType,
    OrgUnitType,
)


class NestedFormSerializer(ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]
        read_only_fields = fields


class NestedMissionWithFormThroughFormSerializer(ModelSerializer):
    form = NestedFormSerializer(read_only=True)

    class Meta:
        model = MissionFormThroughForm
        fields = [
            "form",
            "min_cardinality",
            "max_cardinality",
        ]
        read_only_fields = [
            "min_cardinality",
            "max_cardinality",
        ]


class NestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class NestedEntityTypeSerializer(ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name"]


class NestedMissionFormSerializer(ModelSerializer):
    mission_forms = serializers.SerializerMethodField()

    class Meta:
        model = MissionForm
        fields = [
            "id",
            "name",
            "description",
            "mission_type",
            "mission_forms",
        ]
        read_only_fields = fields

    def get_mission_forms(self, _obj):
        return NestedMissionWithFormThroughFormSerializer(self.context["form_assignments"], many=True).data


class NestedMissionOrgUnitTypeSerializer(ModelSerializer):
    mission_forms = NestedMissionWithFormThroughFormSerializer(
        source="missionformthroughform_set", read_only=True, many=True
    )
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True)

    class Meta:
        model = MissionOrgUnitType
        fields = [
            "id",
            "name",
            "description",
            "mission_type",
            "org_unit_type",
            "min_cardinality",
            "max_cardinality",
            "mission_forms",
        ]
        read_only_fields = fields


class NestedMissionEntityTypeSerializer(ModelSerializer):
    mission_forms = NestedMissionWithFormThroughFormSerializer(
        source="missionformthroughform_set", read_only=True, many=True
    )
    entity_type = NestedEntityTypeSerializer(read_only=True)

    class Meta:
        model = MissionEntityType
        fields = [
            "id",
            "name",
            "description",
            "entity_type",
            "mission_type",
            "min_cardinality",
            "max_cardinality",
            "mission_forms",
        ]
        read_only_fields = fields


class NestedMissionSerializer(PolymorphicSerializer):
    model_serializer_mapping = {
        MissionForm: NestedMissionFormSerializer,
        MissionOrgUnitType: NestedMissionOrgUnitTypeSerializer,
        MissionEntityType: NestedMissionEntityTypeSerializer,
    }

    resource_type_field_name = "mission_type"
    remove_resource_type_field_from_representation = False

    def to_representation(self, instance):
        if isinstance(instance, Mapping):
            resource_type = self._get_resource_type_from_mapping(instance)
            serializer = self._get_serializer_from_resource_type(resource_type)
        else:
            resource_type = self.to_resource_type(instance)
            serializer = self._get_serializer_from_model_or_instance(instance)

        ret = serializer.to_representation(instance)
        if self.resource_type_field_name not in ret and not self.remove_resource_type_field_from_representation:
            ret[self.resource_type_field_name] = resource_type
        return ret
