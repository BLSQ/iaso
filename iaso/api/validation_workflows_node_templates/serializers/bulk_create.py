from django.db import transaction
from rest_framework import serializers

from iaso.api.common import HiddenSlugRelatedField, ModelSerializer
from iaso.api.validation_workflows_node_templates.serializers.common import ValidationWorkflowContextDefault
from iaso.models import UserRole, ValidationNodeTemplate, ValidationWorkflow


class ValidationNodeTemplateBulkCreateListSerializer(serializers.ListSerializer):
    class Meta:
        model = ValidationNodeTemplate

    @transaction.atomic
    def create(self, validated_data):
        # pre generate slugs
        existing_slugs = set(
            ValidationNodeTemplate.objects.filter(workflow__slug=self.context.get("workflow")).values_list(
                "slug", flat=True
            )
        )

        slug_field = ValidationNodeTemplate._meta.get_field("slug")

        instances = []
        for data in validated_data:
            instance = ValidationNodeTemplate(**{k: v for k, v in data.items() if k != "roles_required"})
            instance.slug = slug_field.generate_slug_for_bulk_create(instance, existing_slugs)
            existing_slugs.add(instance.slug)
            instances.append(instance)

        ValidationNodeTemplate.objects.bulk_create(instances, batch_size=100)

        instance_role_pairs = [
            (instance.id, role.pk)
            for instance, data in zip(instances, validated_data)
            for role in data.get("roles_required", [])
        ]
        if instance_role_pairs:
            through = ValidationNodeTemplate.roles_required.through
            through.objects.bulk_create(
                [
                    through(validationnodetemplate_id=inst_id, userrole_id=role_id)
                    for inst_id, role_id in instance_role_pairs
                ],
                ignore_conflicts=True,
            )

        next_links = [
            ValidationNodeTemplate.next_node_templates.through(
                from_validationnodetemplate_id=prev.id, to_validationnodetemplate_id=curr.id
            )
            for prev, curr in zip(instances, instances[1:])
        ]

        if next_links:
            ValidationNodeTemplate.next_node_templates.through.objects.bulk_create(next_links, ignore_conflicts=True)

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
