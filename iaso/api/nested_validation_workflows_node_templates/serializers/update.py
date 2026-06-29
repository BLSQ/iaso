from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from iaso.api.common import ModelSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class ValidationNodeTemplateUpdateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=UserRole.objects.none(), required=False
    )

    class Meta:
        model = ValidationNodeTemplate
        fields = [
            "name",
            "description",
            "roles_required",
            "can_skip_previous_nodes",
            "slug",
        ]

        extra_kwargs = {
            "name": {"write_only": True},
            "description": {"write_only": True},
            "roles_required": {"write_only": True},
            "can_skip_previous_nodes": {"write_only": True},
            "slug": {"read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)

        if account and self.instance:
            self.fields["roles_required"].child_relation.queryset = UserRole.objects.filter(account=account)
            self.fields["name"].validators.append(
                UniqueValidator(
                    queryset=ValidationNodeTemplate.objects.filter(
                        workflow__account=account, workflow=self.instance.workflow
                    ),
                )
            )
