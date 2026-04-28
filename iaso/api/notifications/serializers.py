from rest_framework import serializers


class NotificationSerializer(serializers.Serializer):
    level = serializers.CharField(required=False, source="level.value")
    message = serializers.CharField(required=False)
    type = serializers.CharField(required=False, source="type.value")
