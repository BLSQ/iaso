from rest_framework import serializers

from iaso.api.projects import ProjectSerializer
from iaso.models import Form, Project


class AppSerializer(ProjectSerializer):
    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key.

    All write logic (create/update, forms/feature-flag and configuration validation) is inherited from
    ``ProjectSerializer``; only the id/app_id swap and the readable ``forms`` field are specialized here."""

    class Meta(ProjectSerializer.Meta):
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "description",
            "forms",
            "feature_flags",
            "needs_authentication",
            "redirection_url",
            "min_version",
            "created_at",
            "updated_at",
            "color",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "min_version"]

    id = serializers.CharField(read_only=True, source="app_id")
    # The mobile API exposes `forms` on read, unlike the (write-only) parent declaration.
    forms = serializers.PrimaryKeyRelatedField(many=True, queryset=Form.objects.all(), required=False)
