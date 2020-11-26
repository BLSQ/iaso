from rest_framework import serializers

from ..common import TimestampField
from iaso.models import Project, FeatureFlag


class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = ["id", "code", "name", "description", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "feature_flags", "created_at", "updated_at", "needs_authentication"]
        read_only_fields = ["id", "created_at", "updated_at"]

    feature_flags = FeatureFlagSerializer(many=True, required=False)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
