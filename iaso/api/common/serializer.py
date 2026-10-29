from collections import defaultdict
from typing import Any

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Q
from django.utils.module_loading import import_string
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.models import UserRole

from .serializer_fields import UserRoleNameField


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "full_name"]


class ModelSerializerFieldMappingMixin:
    @property
    def serializer_field_mapping(self):
        mapping = getattr(settings, "REST_FRAMEWORK_SERIALIZER_FIELDS_MAPPINGS", {})
        resolved_mapping = {}

        for model_field_class, serializer_field in mapping.items():
            # Dynamically import from string path to avoid circular import in settings
            if isinstance(serializer_field, str):
                serializer_field = import_string(serializer_field)
            if isinstance(model_field_class, str):
                model_field_class = import_string(model_field_class)
            resolved_mapping[model_field_class] = serializer_field

        return {**serializers.ModelSerializer.serializer_field_mapping, **resolved_mapping}


class ModelSerializer(ModelSerializerFieldMappingMixin, serializers.ModelSerializer):
    pass


class UserRoleNameSerializer(ModelSerializer):
    name = UserRoleNameField(source="group.name", read_only=True)

    class Meta:
        model = UserRole
        fields = ["name", "id"]


class DropdownOptionsSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class DropdownOptionsWithRepresentationSerializer(DropdownOptionsSerializer):
    def to_representation(self, instance):
        return {"value": instance[0], "label": str(instance[1])}


class JsonPatchOperationSerializer(serializers.Serializer):
    """
    Serializer just there for swagger compliance: see https://jsonpatch.com/
    """

    op = serializers.ChoiceField(
        choices=[
            "add",
            "remove",
            "replace",
            "move",
            "copy",
            "test",
        ]
    )
    path = serializers.CharField()
    value = serializers.JSONField(required=False)
    vars()["from"] = serializers.CharField(required=False)


class BulkUpdateListSerializer(serializers.ListSerializer):
    update_fields: tuple[str, ...] = ()
    m2m_fields: dict[str, tuple[str, str]] = {}
    lookup_field: str = "id"
    batch_size: int = 100

    def validate(self, attrs: Any) -> Any:
        """
        Validate that lookup_fields are unique withing the batch provided
        """
        attrs = super().validate(attrs)
        ids = [x[self.lookup_field] for x in attrs if self.lookup_field in x]
        if len(set(ids)) != len(ids):
            raise serializers.ValidationError(
                _("{lookup_field}s provided are not unique").format(lookup_field=self.lookup_field)
            )
        return attrs

    def _sync_bulk_m2m(
        self,
        *,
        through: type[models.Model],
        instances_by_pk: dict[Any, models.Model],
        validated_data: list[dict[str, Any]],
        field: str,
        source_fk: str,
        target_fk: str,
        batch_size: int = 100,
    ) -> None:
        # by updated instance, we get the new values we'd like for the m2m
        # {
        #   instance.pk: {m2m_instance_1.pk, m2m_instance_2.pk, ...}
        # }
        desired_by_source = {
            instances_by_pk[data[self.lookup_field]].pk: {obj.pk for obj in (data[field] or [])}
            for data in validated_data
            if field in data
        }

        if not desired_by_source:
            return

        existing_by_source: dict[Any, set[Any]] = defaultdict(set)

        # we retrieve the existing m2m by instance
        for source_id, target_id in through.objects.filter(**{f"{source_fk}__in": list(desired_by_source)}).values_list(
            source_fk, target_fk
        ):
            existing_by_source[source_id].add(target_id)

        additions: set[tuple[Any, Any]] = set()
        removals: set[tuple[Any, Any]] = set()

        # we compare to optimize queries later
        for source_id, desired in desired_by_source.items():
            existing = existing_by_source[source_id]
            additions.update((source_id, target_id) for target_id in desired - existing)
            removals.update((source_id, target_id) for target_id in existing - desired)

        if removals:
            delete_query = Q()
            for source_id, target_id in removals:
                delete_query |= Q(
                    **{
                        source_fk: source_id,
                        target_fk: target_id,
                    }
                )
            through.objects.filter(delete_query).delete()

        if additions:
            through.objects.bulk_create(
                [
                    through(
                        **{
                            source_fk: source_id,
                            target_fk: target_id,
                        }
                    )
                    for source_id, target_id in additions
                ],
                batch_size=batch_size,
            )

    @transaction.atomic
    def update(self, instances: list[models.Model], validated_data: list[dict]) -> list[models.Model]:
        instances_by_pk = {getattr(obj, self.lookup_field): obj for obj in instances}

        for data in validated_data:
            instance = instances_by_pk[data[self.lookup_field]]

            for field in self.update_fields:
                if field in data:
                    setattr(instance, field, data[field])

        if self.update_fields:
            self.child.Meta.model.objects.bulk_update(
                list(instances_by_pk.values()),
                list(self.update_fields),
                batch_size=self.batch_size,
            )

        for field, (source_fk, target_fk) in self.m2m_fields.items():
            self._sync_bulk_m2m(
                through=getattr(self.child.Meta.model, field).through,
                source_fk=source_fk,
                target_fk=target_fk,
                instances_by_pk=instances_by_pk,
                validated_data=validated_data,
                field=field,
            )

        return [instances_by_pk[data[self.lookup_field]] for data in validated_data]
