from rest_framework import serializers


class MissionTypeSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()
