from rest_framework import serializers


class PipelineLaunchSerializer(serializers.Serializer):
    """Serializer for launching a pipeline task."""

    version = serializers.UUIDField(required=True)
    config = serializers.JSONField(required=True)


class TaskUpdateSerializer(serializers.Serializer):
    """Serializer for updating task status from pipeline."""

    task_id = serializers.IntegerField(required=True)
    status = serializers.CharField(required=False, allow_blank=True)
    progress_message = serializers.CharField(required=False, allow_blank=True)
    progress_value = serializers.IntegerField(required=False, allow_null=True)
    end_value = serializers.IntegerField(required=False, allow_null=True)
    result_data = serializers.JSONField(required=False, allow_null=True)

    def validate_status(self, value):
        """Validate status values."""
        if value and value not in ["RUNNING", "SUCCESS", "ERRORED", "KILLED"]:
            raise serializers.ValidationError("Status must be one of: RUNNING, SUCCESS, ERRORED, KILLED")
        return value


class TaskResponseSerializer(serializers.Serializer):
    """Serializer for task response data."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    status = serializers.CharField()
    progress_message = serializers.CharField(allow_blank=True, required=False)
    progress_value = serializers.IntegerField(allow_null=True, required=False)
    end_value = serializers.IntegerField(allow_null=True, required=False)
    result = serializers.JSONField(allow_null=True, required=False)
    updated_at = serializers.DateTimeField(allow_null=True, required=False)
