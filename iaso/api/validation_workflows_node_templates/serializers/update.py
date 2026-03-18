from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class ValidationNodeTemplateUpdateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(many=True, write_only=True, queryset=UserRole.objects.none())
    previous_node_templates = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
    )
    next_node_templates = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
    )

    class Meta:
        model = ValidationNodeTemplate
        fields = [
            "name",
            "description",
            "color",
            "roles_required",
            "can_skip_previous_nodes",
            "previous_node_templates",
            "next_node_templates",
            "slug",
        ]

        extra_kwargs = {
            "name": {"write_only": True},
            "description": {"write_only": True},
            "color": {"write_only": True},
            "roles_required": {"write_only": True},
            "can_skip_previous_nodes": {"write_only": True},
            "slug": {"read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        self.fields["roles_required"].child_relation.queryset = UserRole.objects.filter(
            account=user.iaso_profile.account
        )
        for field in ["previous_node_templates", "next_node_templates"]:
            self.fields[field].child_relation.queryset = ValidationNodeTemplate.objects.filter(
                workflow__acount=user.iaso_profile.account
            )
