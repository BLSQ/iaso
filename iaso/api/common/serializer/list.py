from __future__ import annotations

from collections import defaultdict
from typing import Any

from django.db import models, transaction
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common.serializer_fields import IasoManyRelatedField, IasoPrimaryKeyRelatedField, IasoSlugRelatedField


class ListQueryOptimizedSerializer(serializers.ListSerializer):
    field_mapping = {
        serializers.PrimaryKeyRelatedField: IasoPrimaryKeyRelatedField,
        serializers.SlugRelatedField: IasoSlugRelatedField,
    }

    @staticmethod
    def clone_field(new_class: type[serializers.Field], field: serializers.Field) -> serializers.Field:
        new_field = new_class(*field._args, **field._kwargs)
        for k, v in field.__dict__.items():
            if k not in {"_args", "_kwargs", "field_name", "parent", "source", "source_attrs", "_queryset_cache"}:
                setattr(new_field, k, v)
        return new_field

    def replace_field(self, field: serializers.Field) -> (serializers.Field | None, bool):
        for k, bulk_class in self.field_mapping.items():
            if isinstance(field, bulk_class):
                return None, True

            if isinstance(field, k):
                return self.clone_field(bulk_class, field), True

        return None, False

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.related_bulk_fields = dict()

        super().__init__(*args, **kwargs)

        for field_name, field in self.child.fields.items():
            if isinstance(field, serializers.ManyRelatedField):
                child = field.child_relation
                new_field, mapped = self.replace_field(child)
                if new_field:
                    self.child.fields[field_name].child_relation = new_field
                    self.related_bulk_fields[field_name] = self.child.fields[field_name].child_relation
                elif mapped:
                    self.related_bulk_fields[field_name] = self.child.fields[field_name].child_relation

                if isinstance(field, IasoManyRelatedField):
                    self.child.fields[field_name].parent_optimized_list = True
            else:
                new_field, mapped = self.replace_field(field)
                if new_field:
                    self.child.fields[field_name] = new_field
                    self.related_bulk_fields[field_name] = self.child.fields[field_name]
                elif mapped:
                    self.related_bulk_fields[field_name] = self.child.fields[field_name]

    def _populate_queryset_caches(self, data) -> None:
        for field_name, field in self.related_bulk_fields.items():
            submitted_ids = []
            for item in data:
                value = item.get(field_name)
                if value is not None:
                    submitted_ids.extend(
                        value if isinstance(value, list | tuple | set) else [value]
                    )  # value can be a list, null or a single value

            if not submitted_ids:
                field.set_queryset_cache([])
            else:
                field.set_queryset_cache([field.normalize_pk(submitted_id) for submitted_id in submitted_ids])

    def to_internal_value(self, data: Any) -> Any:
        if isinstance(data, list):
            self._populate_queryset_caches(data)
        return super().to_internal_value(data)


class BulkUpdateListSerializer(ListQueryOptimizedSerializer):
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
