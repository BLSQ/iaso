from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class NestedRolesRequiredSerializer(ModelSerializer):
    name = serializers.CharField(read_only=True, source="group.name")

    class Meta:
        model = UserRole
        fields = ["name", "id"]


class ValidationNodeTemplateRetrieveSerializer(ModelSerializer):
    roles_required = NestedRolesRequiredSerializer(many=True, read_only=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]
