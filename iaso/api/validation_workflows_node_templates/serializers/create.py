from django.db import transaction
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from iaso.api.common import HiddenSlugRelatedField, ModelSerializer
from iaso.api.validation_workflows_node_templates.serializers.common import ValidationWorkflowContextDefault
from iaso.models import UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.validation_workflow.templates import PositionChoices


class ValidationNodeTemplateCreateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=UserRole.objects.none()
    )
    parent_node_templates = serializers.SlugRelatedField(
        slug_field="slug", many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
    )

    position = serializers.ChoiceField(
        choices=PositionChoices.choices, default=PositionChoices.last, write_only=True, required=False
    )

    workflow = HiddenSlugRelatedField(
        slug_field="slug",
        write_only=True,
        queryset=ValidationWorkflow.objects.none(),
        required=False,
        default=ValidationWorkflowContextDefault(),
    )

    class Meta:
        model = ValidationNodeTemplate
        fields = [
            "name",
            "color",
            "description",
            "slug",
            "roles_required",
            "position",
            "parent_node_templates",
            "can_skip_previous_nodes",
            "workflow",
        ]

        extra_kwargs = {
            "name": {"write_only": True},
            "color": {"write_only": True},
            "description": {"write_only": True},
            "slug": {"read_only": True},
            "can_skip_previous_nodes": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        user = getattr(request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)

        if getattr(iaso_profile, "account", None):
            self.fields["roles_required"].child_relation.queryset = UserRole.objects.filter(
                account=user.iaso_profile.account
            )
            self.fields[
                "parent_node_templates"
            ].child_relation.queryset = ValidationNodeTemplate.objects.select_related(
                "workflow", "workflow__account"
            ).filter(workflow__account=user.iaso_profile.account)

            self.fields["workflow"].queryset = ValidationWorkflow.objects.filter(account=user.iaso_profile.account)
            self.validators = [
                UniqueTogetherValidator(
                    queryset=ValidationNodeTemplate.objects.select_related("workflow", "workflow__account").filter(
                        workflow__account=user.iaso_profile.account
                    ),
                    fields=["name", "workflow"],
                )
            ]

    def validate_parent_node_templates(self, data):
        ids = [item.id for item in data]

        # linear for the moment
        if len(ids) > 1:
            raise serializers.ValidationError("One node maximum allowed.")

        # won't happen for the moment but might be useful later when we allow more than one node
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate nodes are not allowed.")

        return data

    def validate(self, attrs):
        if attrs.get("position", "") == PositionChoices.child_of and not attrs.get("parent_node_templates"):
            raise serializers.ValidationError(
                f"Parent node templates are required if position is set to {PositionChoices.child_of}."
            )
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        position = self.validated_data.pop("position", None)
        parent_node_templates = self.validated_data.pop("parent_node_templates", None)

        instance = super().save(**kwargs)

        self.validated_data["workflow"].insert_node_template(instance, position, parent_node_templates)
        return instance
