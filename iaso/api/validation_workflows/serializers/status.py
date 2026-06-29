from rest_framework import serializers


class StatusSerializer(serializers.Serializer):
    label = serializers.CharField(allow_null=False, allow_blank=False, read_only=True)
    value = serializers.CharField(allow_null=False, allow_blank=False, read_only=True)
