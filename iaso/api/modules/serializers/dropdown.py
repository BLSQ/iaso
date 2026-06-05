from rest_framework import serializers


class ModuleDropdownSerializer(serializers.Serializer):
    label = serializers.CharField(source="name")
    value = serializers.CharField(source="codename")
