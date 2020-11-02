from rest_framework import serializers
from ..projects import ProjectSerializer


class AppSerializer(ProjectSerializer):
    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key."""

    class Meta(ProjectSerializer.Meta):
        fields = ["id", "name", "feature_flags", "needs_authentication", "created_at", "updated_at"]
        read_only_fields = ["id", "name", "feature_flags", "needs_authentication", "created_at", "updated_at"]

    id = serializers.CharField(read_only=True, source="app_id")
