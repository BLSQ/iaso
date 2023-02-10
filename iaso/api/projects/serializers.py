from rest_framework import serializers

from iaso.models import Project, FeatureFlag
from ..common import TimestampField


class FeatureFlagSerializer(serializers.Serializer):
    class Meta:
        model = FeatureFlag
        fields = ["id", "code", "name", "description", "created_at", "updated_at"]

    id = serializers.IntegerField()
    name = serializers.CharField(max_length=200)
    code = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    created_at = TimestampField(read_only=True, required=False)
    updated_at = TimestampField(read_only=True, required=False)

    def validate_code(self, data):
        if FeatureFlag.objects.filter(code=data).count() == 1:
            return data
        else:
            raise serializers.ValidationError("Unknown feature flag code")


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "feature_flags", "created_at", "updated_at", "needs_authentication"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_app_id(self, data):
        data = data.strip()
        request = self.context["request"]
        if not data:
            raise serializers.ValidationError("An App id is necessary")
        if data != "" and data != request.data.get("id"):
            if Project.objects.filter(app_id=data).count() > 0:
                raise serializers.ValidationError("App id already used")
        return data

    feature_flags = FeatureFlagSerializer(many=True, required=True, allow_empty=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
