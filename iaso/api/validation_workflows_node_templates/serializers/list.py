from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class NestedRolesRequiredSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["name", "id"]

    def get_name(self, obj):
        return obj.group.name.removeprefix(f"{obj.account_id}_")


class ValidationNodeTemplateListSerializer(ModelSerializer):
    roles_required = NestedRolesRequiredSerializer(read_only=True, many=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]
