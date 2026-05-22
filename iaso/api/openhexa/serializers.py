from rest_framework import serializers

from iaso.models import Task


class PipelineLaunchSerializer(serializers.Serializer):
    """Serializer for launching a pipeline task."""

    version = serializers.UUIDField(required=True)
    config = serializers.JSONField(required=True)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating task status from pipeline."""

    task_id = serializers.IntegerField(source="id", required=True)
    result = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ["task_id", "status", "progress_message", "progress_value", "end_value", "result"]
        extra_kwargs = {
            "status": {"required": False, "allow_blank": True},
            "progress_message": {"required": False, "allow_blank": True},
            "progress_value": {"required": False, "allow_null": True},
            "end_value": {"required": False, "allow_null": True},
        }

    def validate_task_id(self, value):
        """Validate that the task exists."""
        try:
            Task.objects.get(pk=value)
        except Task.DoesNotExist:
            raise serializers.ValidationError("Task with this ID does not exist.")
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


class OpenHexaConfigSerializer(serializers.Serializer):
    """Serializer for validating OpenHexa configuration."""

    openhexa_url = serializers.URLField(required=True, allow_blank=False)
    openhexa_token = serializers.CharField(required=True, allow_blank=False)
    workspace_slug = serializers.CharField(required=True, allow_blank=False)
    lqas_pipeline_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        """Validate that all required fields are present and not empty."""
        required_fields = ["openhexa_url", "openhexa_token", "workspace_slug"]

        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError(f"{field} is required and cannot be empty.")

        return data
