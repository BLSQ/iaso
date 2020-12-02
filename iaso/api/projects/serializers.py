from rest_framework import serializers, exceptions

from ..common import TimestampField
from iaso.models import Project, FeatureFlag


class FeatureFlagSerializer(serializers.Serializer):
    class Meta:
        model = FeatureFlag
        fields = ["id", "code", "name", "description", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True, required=False)
    updated_at = TimestampField(read_only=True, required=False)
    name = serializers.CharField(max_length=200)
    code = serializers.CharField(max_length=200)
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    id = serializers.IntegerField()

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

    feature_flags = FeatureFlagSerializer(many=True, required=False)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
