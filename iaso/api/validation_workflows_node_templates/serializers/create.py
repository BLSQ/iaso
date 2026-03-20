from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.common import HiddenSlugRelatedField, ModelSerializer
from iaso.api.validation_workflows_node_templates.serializers.common import ValidationWorkflowContextDefault
from iaso.models import UserRole, ValidationNodeTemplate, ValidationWorkflow


class ValidationNodeTemplateCreateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=UserRole.objects.none()
    )
    previous_node_templates = serializers.SlugRelatedField(
        slug_field="slug", many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
    )
    next_node_templates = serializers.SlugRelatedField(
        slug_field="slug", many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
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
            "previous_node_templates",
            "next_node_templates",
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
        self.fields["roles_required"].child_relation.queryset = UserRole.objects.filter(
            account=user.iaso_profile.account
        )
        for field in ["previous_node_templates", "next_node_templates"]:
            self.fields[field].child_relation.queryset = ValidationNodeTemplate.objects.select_related(
                "workflow", "workflow__account"
            ).filter(workflow__account=user.iaso_profile.account)
        self.fields["workflow"].queryset = ValidationWorkflow.objects.prefetch_related("node_templates").filter(
            account=user.iaso_profile.account
        )

    def validate_previous_node_templates(self, data):
        ids = [item.id for item in data]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate nodes are not allowed.")

        # linear for the moment
        if len(ids) > 1:
            raise serializers.ValidationError("One node maximum allowed.")

        return data

    def validate_next_node_templates(self, data):
        ids = [item.id for item in data]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate nodes are not allowed.")

        # linear for the moment
        if len(ids) > 1:
            raise serializers.ValidationError("One node maximum allowed.")

        return data

    def validate(self, attrs):
        if not attrs.get("next_node_templates") and not attrs.get("previous_node_templates"):
            # we check that it's really the only node in the workflow
            related_validation_workflow = attrs.get("workflow")
            if related_validation_workflow.node_templates.exists():
                raise ValidationError("You must specify either next node templates or previous node templates.")

        if attrs.get("previous_node_templates") and attrs.get("next_node_templates"):
            # we check that some ids are not present in both.
            if set(attrs["previous_node_templates"]).intersection(set(attrs["next_node_templates"])):
                raise ValidationError("There are duplicate nodes in previous and next node templates.")

        # todo: more checks
        # can we insert between two nodes? (+ adding a start, adding a last)

        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        instance = super().save(**kwargs)
        self.validated_data["workflow"].insert_node_template(instance)
        return instance
