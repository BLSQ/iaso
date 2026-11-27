from rest_framework import serializers


class ValidationWorkflowInstanceCountsSerializer(serializers.Serializer):
    all = serializers.IntegerField(read_only=True)
    awaiting_my_action = serializers.IntegerField(read_only=True)
    awaiting_others = serializers.IntegerField(read_only=True)
    handled_by_me = serializers.IntegerField(read_only=True)
    rejected = serializers.IntegerField(read_only=True)
    oldest_pending_since = serializers.DateTimeField(read_only=True, allow_null=True)
