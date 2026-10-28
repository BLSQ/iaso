from typing import cast

from django.db import transaction
from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import BulkUpdateListSerializer
from iaso.models import UserRole, ValidationNodeTemplate


class ValidationNodeTemplateBulkUpdateListSerializer(BulkUpdateListSerializer):
    update_fields = ["name", "description", "can_skip_previous_nodes"]
    lookup_field = "slug"
    m2m_fields = {"roles_required": ("validationnodetemplate_id", "userrole_id")}

    class Meta:
        model = ValidationNodeTemplate
        fields = []

    @transaction.atomic
    def update(
        self, instances: list[ValidationNodeTemplate], validated_data: list[dict]
    ) -> list[ValidationNodeTemplate]:
        rtn_instances = cast(list[ValidationNodeTemplate], super().update(instances, validated_data))

        instances = {x.slug: x for x in rtn_instances}

        ordered_instances = [instances[data["slug"]] for data in validated_data]

        through = ValidationNodeTemplate.next_node_templates.through

        # clear current
        q_delete = Q()
        for instance in ordered_instances:
            q_delete |= Q(from_validationnodetemplate_id=instance.id) | Q(to_validationnodetemplate_id=instance.id)

        if q_delete:
            ValidationNodeTemplate.next_node_templates.through.objects.filter(q_delete).delete()

        # reinsert
        prev_links = [
            through(from_validationnodetemplate_id=prev.id, to_validationnodetemplate_id=curr.id)
            for prev, curr in zip(ordered_instances, ordered_instances[1:])
        ]
        if prev_links:
            through.objects.bulk_create(prev_links, batch_size=100, ignore_conflicts=True)

        return ordered_instances

    def validate(self, attrs):
        slugs = list(map(lambda x: x["slug"], attrs))

        if len(slugs) != len(set(slugs)):
            raise ValidationError("Duplicate slugs provided.")

        if len(slugs) != self.instance.count():
            raise ValidationError("The slugs provided don't match the existing ones")

        if set(slugs) != set(self.instance.values_list("slug", flat=True)):
            raise ValidationError("The slugs provided don't match the existing ones")

        names = [x["name"] for x in attrs]
        if len(set(names)) != len(list(names)):
            raise ValidationError("Names must be unique.")

        return attrs


class ValidationNodeTemplateBulkUpdateSerializer(ModelSerializer):
    roles_required = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False, queryset=UserRole.objects.none()
    )
    slug = serializers.CharField(required=True, allow_null=False, allow_blank=False)

    class Meta:
        list_serializer_class = ValidationNodeTemplateBulkUpdateListSerializer
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "roles_required", "can_skip_previous_nodes"]
        extra_kwargs = {
            "slug": {"required": True},
            "name": {"write_only": True},
            "description": {"write_only": True},
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

    def update(self, instance, validated_data):
        slug = validated_data.pop("slug")

        # we clear the relations
        validated_data["next_node_templates"] = []
        validated_data["previous_node_templates"] = []

        instance._initial_slug = slug
        # not necessary for the moment but it'll be useful when we want to optimize the order change

        return super().update(instance=instance, validated_data=validated_data)
