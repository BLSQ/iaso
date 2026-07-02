from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.missions.serializers.common import BaseMissionPolymorphicSerializer
from iaso.api.missions.serializers.create.mission_form import NestedMissionFormThroughFormCreateSerializer
from iaso.models import MissionForm


class MissionFormUpdateSerializer(ModelSerializer):
    forms = NestedMissionFormThroughFormCreateSerializer(many=True, required=True, allow_empty=False, write_only=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)

    class Meta:
        model = MissionForm
        fields = ["id", "name", "description", "forms", "created_by"]
        read_only_fields = ["id"]

        extra_kwargs = {"id": {"read_only": True}, "name": {"write_only": True}, "description": {"write_only": True}}

    def update(self, instance, validated_data):
        # todo
        pass

    # def __init__(self, *args, **kwargs):
    #     super().__init__(*args, **kwargs)
    #     if getattr(self.context.get('request', None), "user", None):
    #         self.fields['forms'].child_relation.queryset = Form.objects.filter_on_user_projects(self.context['request'].user)


class MissionPolymorphicUpdateSerializer(BaseMissionPolymorphicSerializer):
    model_serializer_mapping = {MissionForm: MissionFormUpdateSerializer}
    remove_resource_type_field_from_representation = True
