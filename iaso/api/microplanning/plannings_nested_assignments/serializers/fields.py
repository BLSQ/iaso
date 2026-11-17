from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Model
from rest_framework import serializers
from rest_framework.relations import MANY_RELATION_KWARGS


class BulkManyRelatedField(serializers.ManyRelatedField):
    """Resolves all the primary keys in a single query, dropping duplicates while keeping the input order."""

    def to_internal_value(self, data: Any) -> list[Model]:
        if isinstance(data, str) or not hasattr(data, "__iter__"):
            self.fail("not_a_list", input_type=type(data).__name__)
        if not self.allow_empty and len(data) == 0:
            self.fail("empty")

        child = self.child_relation
        queryset = child.get_queryset()
        pks = list(dict.fromkeys(self._to_pk(item, queryset.model) for item in data))
        object_by_pk = {obj.pk: obj for obj in queryset.filter(pk__in=pks)}
        missing_pks = [pk for pk in pks if pk not in object_by_pk]
        if missing_pks:
            raise serializers.ValidationError(
                [child.error_messages["does_not_exist"].format(pk_value=pk) for pk in missing_pks]
            )
        return [object_by_pk[pk] for pk in pks]

    def _to_pk(self, item: Any, model: type[Model]) -> Any:
        child = self.child_relation
        if child.pk_field is not None:
            item = child.pk_field.to_internal_value(item)
        if isinstance(item, bool):
            child.fail("incorrect_type", data_type=type(item).__name__)
        try:
            return model._meta.pk.to_python(item)
        except DjangoValidationError:
            child.fail("incorrect_type", data_type=type(item).__name__)


class BulkPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """`PrimaryKeyRelatedField` whose `many=True` variant is a `BulkManyRelatedField`."""

    @classmethod
    def many_init(cls, *args: Any, **kwargs: Any) -> BulkManyRelatedField:
        list_kwargs = {key: value for key, value in kwargs.items() if key in MANY_RELATION_KWARGS}
        return BulkManyRelatedField(child_relation=cls(*args, **kwargs), **list_kwargs)
