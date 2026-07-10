from collections.abc import Mapping

from rest_framework.fields import empty
from rest_polymorphic.serializers import PolymorphicSerializer


class BaseMissionPolymorphicSerializer(PolymorphicSerializer):
    resource_type_field_name = "mission_type"
    remove_resource_type_field_from_representation = False

    def is_valid(self, *args, **kwargs):
        valid = super(PolymorphicSerializer, self).is_valid(*args, **kwargs)
        if hasattr(self, "_child_serializer"):
            self._errors.update(self._child_serializer.errors)
        return valid

    def run_validation(self, data=empty):
        if self.instance:
            resource_type = self.to_resource_type(self.instance)
            serializer = self._get_serializer_from_model_or_instance(self.instance)
        else:
            resource_type = self._get_resource_type_from_mapping(data)
            serializer = self._get_serializer_from_resource_type(resource_type)

        validated_data = serializer.run_validation(data)
        validated_data[self.resource_type_field_name] = resource_type
        return validated_data

    def update(self, instance, validated_data):
        # we don't allow to modify the mission_type, so better deduct it
        resource_type = getattr(instance, self.resource_type_field_name)
        serializer = self._get_serializer_from_resource_type(resource_type)
        return serializer.update(instance, validated_data)

    def to_resource_type(self, model_or_instance):
        if isinstance(model_or_instance, type):
            return str(model_or_instance.MISSION_TYPE)

        return str(model_or_instance.mission_type)

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
