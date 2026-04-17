from django.conf import settings
from django.contrib.auth.models import User
from django.utils.module_loading import import_string
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "full_name"]


class ModelSerializer(serializers.ModelSerializer):
    @property
    def serializer_field_mapping(self):
        mapping = getattr(settings, "REST_FRAMEWORK_SERIALIZER_FIELDS_MAPPINGS", {})
        resolved_mapping = {}

        for model_field_class, serializer_field in mapping.items():
            # Dynamically import from string path to avoid circular import in settings
            if isinstance(serializer_field, str):
                serializer_field = import_string(serializer_field)
            if isinstance(model_field_class, str):
                model_field_class = import_string(model_field_class)
            resolved_mapping[model_field_class] = serializer_field

        return {**serializers.ModelSerializer.serializer_field_mapping, **resolved_mapping}


class DropdownOptionsSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class DropdownOptionsWithRepresentationSerializer(DropdownOptionsSerializer):
    def to_representation(self, instance):
        return {"value": instance[0], "label": str(instance[1])}
