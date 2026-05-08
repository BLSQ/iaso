from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import UserRoleNameSerializer
from iaso.models import ValidationNodeTemplate


class ValidationNodeTemplateListSerializer(ModelSerializer):
    roles_required = UserRoleNameSerializer(read_only=True, many=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]
