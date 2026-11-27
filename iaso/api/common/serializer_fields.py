from __future__ import annotations

import json
import re

from abc import ABC, abstractmethod
from collections.abc import Sequence
from datetime import date, datetime, timezone
from typing import Any

import pytz

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import QuerySet
from django.utils.encoding import smart_str
from django.utils.translation import gettext_lazy as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from phonenumber_field.phonenumber import PhoneNumber
from phonenumbers import NumberParseException
from rest_framework import serializers
from rest_framework.fields import empty
from rest_framework.relations import MANY_RELATION_KWARGS, ManyRelatedField

from iaso.api.common.validators import JSONSchemaFieldValidator


@extend_schema_field(OpenApiTypes.NUMBER)
class TimestampField(serializers.Field):
    def to_representation(self, value: datetime):
        return value.timestamp()

    def to_internal_value(self, data: float):
        return datetime.fromtimestamp(data, tz=timezone.utc)


class DateTimestampField(serializers.Field):
    """Represent a date as a timestampfield

    Use only for mobile APIs"""

    def to_representation(self, value: date):
        return datetime(value.year, value.month, value.day, 0, 0, 0, tzinfo=pytz.utc).timestamp()

    def to_internal_value(self, data: float):
        return datetime.fromtimestamp(data, tz=timezone.utc).date()


@extend_schema_field(OpenApiTypes.NONE)
class HiddenSlugRelatedField(serializers.SlugRelatedField):
    def __init__(self, *args, **kwargs):
        if not kwargs.get("default"):
            raise ValueError("default is a required argument.")
        kwargs["required"] = False
        kwargs["write_only"] = True
        super().__init__(*args, **kwargs)

    def run_validation(self, data=serializers.empty):
        if data is serializers.empty:
            data = self.get_default()
        return super().run_validation(data)

    def get_value(self, dictionary):
        return serializers.empty


@extend_schema_field(OpenApiTypes.OBJECT)
class JSONSchemaField(serializers.JSONField):
    def __init__(self, schema, *args, **kwargs):
        # for swagger
        kwargs.setdefault("help_text", f"JSON object matching schema: {schema}")

        kwargs.setdefault("allow_null", False)

        super().__init__(*args, **kwargs)
        self.validators = [JSONSchemaFieldValidator(schema=schema)]


class AccountPrefixedSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        account_id = self.context["account_id"]
        prefixed_name = f"{account_id}_{data}"
        return super().to_internal_value(prefixed_name)


@extend_schema_field(OpenApiTypes.STR)
class UserRoleNameField(serializers.CharField):
    def to_representation(self, value):
        return re.sub(r"^\d+_", "", value)


class SlugOrPrimaryKeyRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        if isinstance(data, int):
            queryset = self.get_queryset()
            try:
                return queryset.get(pk=data)
            except ObjectDoesNotExist:
                self.fail("does_not_exist", slug_name="pk", value=smart_str(data))
            except (TypeError, ValueError):
                self.fail("invalid")
        else:
            return super().to_internal_value(data)


class ManyRelatedFieldForMultiPart(ManyRelatedField):
    def get_value(self, dictionary):
        data = dictionary.get(self.field_name, empty)
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (ValueError, json.JSONDecodeError):
                self.fail("not_a_list", input_type=type(data).__name__)
        return data


def split_comma_separated_string_from_query_params(dictionary, key):
    if key not in dictionary:
        return empty
    return [item.strip() for item in dictionary[key].split(",")]


class CommaSeparatedPrimaryKeysField(ManyRelatedField):
    """Primary keys given as a single query param, separated by ',' (e.g. `?ids=1,2,3`)"""

    def get_value(self, dictionary):
        return split_comma_separated_string_from_query_params(dictionary, self.field_name)


class CommaSeparatedMultipleChoiceField(serializers.MultipleChoiceField):
    """Choices given as a single query param, separated by ',' (e.g. `?status=A,B`)"""

    def get_value(self, dictionary):
        return split_comma_separated_string_from_query_params(dictionary, self.field_name)


class CommaSeparatedListField(serializers.ListField):
    """List given as a single query param, separated by ',' (e.g. `?ids=1,2,3`)"""

    def get_value(self, dictionary):
        return split_comma_separated_string_from_query_params(dictionary, self.field_name)


class PrimaryKeyRelatedFieldFromJSON(serializers.PrimaryKeyRelatedField):
    """
    This field purpose is to make the classic PrimaryKeyRelatedField work with multipart/form-data in case of many=True
    """

    @classmethod
    def many_init(cls, *args, **kwargs):
        list_kwargs = {"child_relation": cls(*args, **kwargs)}
        for key, value in kwargs.items():
            if key in MANY_RELATION_KWARGS:
                list_kwargs[key] = value

        return ManyRelatedFieldForMultiPart(**list_kwargs)


class CountryAwarePhoneNumberField(serializers.CharField):
    default_error_messages = {
        "invalid": _("Enter a valid phone number."),
        "both_required": _("Both the phone number and the country code must be provided"),
    }

    def __init__(self, country_code_field="country_code", **kwargs):
        self.country_code_field = country_code_field
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        if isinstance(value, PhoneNumber):
            return value

        serializer = self.parent
        country_code = serializer.initial_data.get(self.country_code_field)

        if not country_code:
            self.fail("both_required")

        try:
            number = PhoneNumber.from_string(
                value,
                region=country_code.upper(),
            )
        except NumberParseException:
            self.fail("invalid")

        if not number.is_valid():
            self.fail("invalid")

        return number

    def to_representation(self, value):
        if not value:
            return None

        return value.as_e164


class CurrentAccountDefault:
    requires_context = True

    def __init__(self, returns_id=False):
        self.returns_id = returns_id

    def __call__(self, serializer_field):
        try:
            if self.returns_id:
                return serializer_field.context["request"].user.iaso_profile.account_id
            return serializer_field.context["request"].user.iaso_profile.account
        except (KeyError, ValueError):
            return None


class BaseQueryOptimizedRelatedFieldMixin(ABC):
    @abstractmethod
    def set_queryset_cache(self, data: Sequence[Any]) -> None: ...

    @abstractmethod
    def normalize_pk(self, data: Any) -> Any: ...

    @abstractmethod
    def to_internal_value(self, data: Any) -> models.Model: ...

    @abstractmethod
    def get_queryset_for_cache(self, data: Sequence[Any]) -> QuerySet: ...

    @classmethod
    def many_init(cls, *args: Any, **kwargs: Any) -> ManyRelatedField:
        list_kwargs = {"child_relation": cls(*args, **kwargs)}
        for key, value in kwargs.items():
            if key in MANY_RELATION_KWARGS:
                list_kwargs[key] = value
        return IasoManyRelatedField(**list_kwargs)


class IasoManyRelatedField(ManyRelatedField):
    parent_optimized_list = False

    def __init__(self, *args: Any, **kwargs: Any):
        parent_optimized_list = kwargs.pop("parent_optimized_list", False)
        super().__init__(*args, **kwargs)
        if not isinstance(self.child_relation, BaseQueryOptimizedRelatedFieldMixin):
            raise ValueError
        self.parent_optimized_list = parent_optimized_list

    def to_internal_value(self, data) -> models.Model:
        if isinstance(data, str) or not hasattr(data, "__iter__"):
            self.fail("not_a_list", input_type=type(data).__name__)
        if not self.allow_empty and len(data) == 0:
            self.fail("empty")

        if not self.parent_optimized_list:
            # do not reset the queryset_cache if it has already been set, mostly happens in case of that field being in a list serializer
            self.child_relation.set_queryset_cache(data)

        return [self.child_relation.to_internal_value(item) for item in data]


class IasoPrimaryKeyRelatedField(BaseQueryOptimizedRelatedFieldMixin, serializers.PrimaryKeyRelatedField):
    _queryset_cache: dict[int, models.Model]

    def set_queryset_cache(self, data: Any) -> None:
        self._queryset_cache = {instance.pk: instance for instance in self.get_queryset_for_cache(data)}

    def normalize_pk(self, data: Any) -> Any:
        if self.pk_field is not None:
            return self.pk_field.to_internal_value(data)
        return data

    def get_queryset_for_cache(self, data: Sequence[int]) -> QuerySet:
        return self.get_queryset().filter(pk__in=data)

    def to_internal_value(self, data: Any) -> models.Model:
        if not hasattr(self, "_queryset_cache"):
            return serializers.PrimaryKeyRelatedField.to_internal_value(self, data)

        data = self.normalize_pk(data)

        try:
            return self._queryset_cache[data]
        except KeyError:
            self.fail("does_not_exist", pk_value=data)


class IasoSlugRelatedField(BaseQueryOptimizedRelatedFieldMixin, serializers.SlugRelatedField):
    _queryset_cache: dict[str, models.Model]

    def set_queryset_cache(self, data: Sequence[str]) -> None:
        if not self.slug_field:
            return

        self._queryset_cache = {
            getattr(instance, self.slug_field): instance for instance in self.get_queryset_for_cache(data)
        }

    def get_queryset_for_cache(self, data: Sequence[str]) -> QuerySet:
        return self.get_queryset().filter(**{f"{self.slug_field}__in": data})

    @staticmethod
    def normalize_pk(data: Any) -> Any:
        return data

    def to_internal_value(self, data: Any) -> models.Model:
        if not hasattr(self, "_queryset_cache"):
            return serializers.SlugRelatedField.to_internal_value(self, data)

        try:
            return self._queryset_cache[data]
        except KeyError:
            self.fail("does_not_exist", slug_name=self.slug_field, value=smart_str(data))
