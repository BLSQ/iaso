from rest_framework import serializers


class PipelineListSerializer(serializers.Serializer):
    """
    Serializer for OpenHexa pipeline list response.
    """

    id = serializers.CharField()
    name = serializers.CharField()
    currentVersion = serializers.DictField()


class PipelineDetailSerializer(serializers.Serializer):
    """
    Serializer for OpenHexa pipeline detail response.
    """

    id = serializers.CharField()
    name = serializers.CharField()
    currentVersion = serializers.DictField()


class PipelineParametersSerializer(serializers.Serializer):
    """
    Serializer for retrieving OpenHexa pipeline parameters.
    """

    pipeline_id = serializers.CharField(
        max_length=100,
        allow_blank=False,
        help_text="The OpenHexa pipeline ID (UUID format) to retrieve parameters for",
        style={"input_type": "text", "placeholder": "Enter OpenHexa pipeline ID"},
    )

    def validate_pipeline_id(self, value):
        """Validate that pipeline_id is not empty and properly formatted."""
        if not value or not value.strip():
            raise serializers.ValidationError("Pipeline ID cannot be empty")

        # Basic UUID format validation
        import re

        uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        if not re.match(uuid_pattern, value.strip(), re.IGNORECASE):
            raise serializers.ValidationError("Pipeline ID must be a valid UUID format")

        return value.strip()


class PipelineLaunchSerializer(serializers.Serializer):
    """Serializer for launching a pipeline task."""

    version = serializers.UUIDField(required=True)
    config = serializers.JSONField(required=True)
