from django.db import transaction
from rest_framework import serializers

from iaso.api.common import HiddenSlugRelatedField, ModelSerializer
from iaso.api.validation_workflows_node_templates.serializers.common import ValidationWorkflowContextDefault
from iaso.models import UserRole, ValidationNodeTemplate, ValidationWorkflow


class ValidationNodeTemplateBulkCreateListSerializer(serializers.ListSerializer):
    class Meta:
        model = ValidationNodeTemplate

    def create(self, validated_data):
        with transaction.atomic():
            instances = []
            for data in validated_data:
                instance = self.child.create(data)
                instances.append(instance)

            for prev, curr in zip(instances, instances[1:]):
                curr.previous_node_templates.add(prev)
            return instances


class ValidationNodeTemplateBulkCreateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=UserRole.objects.none()
    )
    workflow = HiddenSlugRelatedField(
        slug_field="slug",
        write_only=True,
        queryset=ValidationWorkflow.objects.none(),
        required=False,
        default=ValidationWorkflowContextDefault(),
    )

    class Meta:
        list_serializer_class = ValidationNodeTemplateBulkCreateListSerializer
        model = ValidationNodeTemplate
        fields = ["name", "color", "description", "roles_required", "can_skip_previous_nodes", "slug", "workflow"]
        extra_kwargs = {
            "slug": {"read_only": True},
            "name": {"write_only": True},
            "description": {"write_only": True},
            "color": {"write_only": True},
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
            self.fields["workflow"].queryset = ValidationWorkflow.objects.filter(account=user.iaso_profile.account)
