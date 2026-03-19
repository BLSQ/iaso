from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.common import ModelSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class ValidationNodeTemplateBulkUpdateListSerializer(serializers.ListSerializer):
    class Meta:
        model = ValidationNodeTemplate
        fields = []

    @transaction.atomic
    def update(self, instances, validated_data):
        instances = {x.slug: x for x in instances}
        updated_instances = []
        for data in validated_data:
            instance = self.child.update(instances[data["slug"]], data)
            updated_instances.append(instance)

        for prev, curr in zip(updated_instances, updated_instances[1:]):
            curr.previous_node_templates.add(prev)
        return updated_instances

    def validate(self, attrs):
        slugs = list(map(lambda x: x["slug"], attrs))

        if len(slugs) != len(set(slugs)):
            raise ValidationError("Duplicate slugs provided.")

        if len(slugs) != self.instance.count():
            raise ValidationError("The slugs provided don't match the existing ones")

        if set(slugs) != set(self.instance.values_list("slug", flat=True)):
            raise ValidationError("The slugs provided don't match the existing ones")

        return attrs


class ValidationNodeTemplateBulkUpdateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=UserRole.objects.none()
    )
    slug = serializers.CharField(required=True, allow_null=False, allow_blank=False)

    class Meta:
        list_serializer_class = ValidationNodeTemplateBulkUpdateListSerializer
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]
        extra_kwargs = {
            "slug": {"required": True},
            "name": {"write_only": True},
            "description": {"write_only": True},
            "color": {"write_only": True},
            "can_skip_previous_nodes": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        self.fields["roles_required"].child_relation.queryset = UserRole.objects.filter(
            account=user.iaso_profile.account
        )

    def update(self, instance, validated_data):
        slug = validated_data.pop("slug")

        # we clear the relations
        validated_data["next_node_templates"] = []
        validated_data["previous_node_templates"] = []

        instance._initial_slug = slug
        # not necessary for the moment but it'll be useful when we want to optimize the order change

        return super().save(instance=instance, validated_data=validated_data)
