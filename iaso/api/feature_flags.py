import typing
from .common import ModelViewSet, TimestampField
from iaso.models import FeatureFlag
from rest_framework import serializers, permissions


class FeatureFlagsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag

        fields = ["id", "code", "name", "description", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

class FeatureFlagViewSet(ModelViewSet):
    """ Feature flag API

    This API is restricted to authenticated users

    GET /api/featureflags/
    GET /api/featureflags/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FeatureFlagsSerializer
    results_key = "featureflags"
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        featureflags = FeatureFlag.objects.all()

        return featureflags.order_by("name")
