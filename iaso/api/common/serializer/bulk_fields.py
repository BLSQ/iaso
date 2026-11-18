from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from django.db import models
from django.db.models import QuerySet
from django.utils.encoding import smart_str
from rest_framework import serializers


class BaseBulkRelatedFieldMixin(ABC):
    @abstractmethod
    def set_queryset_cache(self, queryset: QuerySet) -> None: ...

    @abstractmethod
    def normalize_pk(self, data: Any) -> Any: ...

    @abstractmethod
    def to_internal_value(self, data: Any) -> models.Model: ...

    @abstractmethod
    def get_lookup_field(self) -> str: ...

    # @classmethod
    # def many_init(cls, *args: Any, **kwargs: Any) -> ManyRelatedField:
    #     list_kwargs = {"child_relation": cls(*args, **kwargs)}
    #     for key in kwargs:
    #         if key in MANY_RELATION_KWARGS:
    #             list_kwargs[key] = kwargs[key]
    #     return BulkManyRelatedField(**list_kwargs)


# class BulkManyRelatedField(ManyRelatedField):
#     def __init__(self, *args: Any, **kwargs: Any):
#         super().__init__(*args, **kwargs)
#         if not isinstance(self.child_relation, BaseBulkRelatedFieldMixin):
#             raise ValueError
#
#     def to_internal_value(self, data):
#         if isinstance(data, str) or not hasattr(data, "__iter__"):
#             self.fail("not_a_list", input_type=type(data).__name__)
#         if not self.allow_empty and len(data) == 0:
#             self.fail("empty")
#
#         self.child_relation.set_queryset_cache(
#             self.child_relation.get_queryset().filter(pk__in=data)
#         )
#
#         return [self.child_relation.to_internal_value(item) for item in data]


class BulkPrimaryKeyRelatedField(BaseBulkRelatedFieldMixin, serializers.PrimaryKeyRelatedField):
    _queryset_cache: dict[int | str, models.Model]

    def set_queryset_cache(self, queryset: QuerySet) -> None:
        self._queryset_cache = {instance.pk: instance for instance in queryset}

    def normalize_pk(self, data: Any) -> Any:
        if self.pk_field is not None:
            return self.pk_field.to_internal_value(data)
        return data

    def to_internal_value(self, data: Any) -> models.Model:
        if not hasattr(self, "_queryset_cache"):
            return super().to_internal_value(data)

        data = self.normalize_pk(data)

        try:
            return self._queryset_cache[data]
        except KeyError:
            self.fail("does_not_exist", pk_value=data)

    def get_lookup_field(self) -> str:
        return "pk"


class BulkSlugRelatedField(serializers.SlugRelatedField):
    _queryset_cache: dict[int | str, models.Model]

    def set_queryset_cache(self, queryset: QuerySet) -> None:
        if not self.slug_field:
            return

        self._queryset_cache = {getattr(instance, self.slug_field): instance for instance in queryset}

    @staticmethod
    def normalize_pk(data: Any) -> Any:
        return data

    def to_internal_value(self, data: Any) -> models.Model:
        if not hasattr(self, "_queryset_cache"):
            return super().to_internal_value(data)

        try:
            return self._queryset_cache[data]
        except KeyError:
            self.fail("does_not_exist", slug_name=self.slug_field, value=smart_str(data))

    def get_lookup_field(self) -> str:
        if not self.slug_field:
            raise ValueError
        return self.slug_field
