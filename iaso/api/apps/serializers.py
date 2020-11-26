from rest_framework import serializers
from rest_framework.response import Response
from ..projects import ProjectSerializer
from iaso.models import Project, Form, FeatureFlag
from hat.audit import models as audit_models
import logging
logger = logging.getLogger(__name__)


class AppSerializer(ProjectSerializer):
    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key."""

    class Meta(ProjectSerializer.Meta):
        model = Project
        fields = ["id", "name", "app_id", "forms", "feature_flags", "needs_authentication", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    id = serializers.CharField(read_only=True, source="app_id")

    def update(self, instance, validated_data):
        feature_flags = validated_data.pop('feature_flags', None)
        app_id = validated_data.pop('app_id', None)
        name = validated_data.pop('name', None)
        if app_id is not None:
            instance.app_id = app_id
        if name is not None:
            instance.name = name
        instance.save()
        if feature_flags is not None:
            instance.feature_flags.clear()
            for f in feature_flags:
                f_object = FeatureFlag.objects.get(code=f["code"])
                instance.feature_flags.add(f_object)

        return instance
