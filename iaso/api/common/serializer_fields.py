import json

from datetime import date, datetime

import pytz

from django.core.exceptions import ObjectDoesNotExist
from django.utils.encoding import smart_str
from django.utils.timezone import make_aware
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
        return make_aware(datetime.utcfromtimestamp(data))


class DateTimestampField(serializers.Field):
    """Represent a date as a timestampfield

    Use only for mobile APIs"""

    def to_representation(self, value: date):
        return datetime(value.year, value.month, value.day, 0, 0, 0, tzinfo=pytz.utc).timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data)).date()


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
class UserRoleNameField(serializers.Field):
    def to_representation(self, user_role):
        return user_role.group.name.removeprefix(f"{user_role.account_id}_")
        
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


class PrimaryKeyRelatedFieldFromJSON(serializers.PrimaryKeyRelatedField):
    """
    This field purpose is to make the classic PrimaryKeyRelatedField work with multipart/form-data in case of many=True
    """

    @classmethod
    def many_init(cls, *args, **kwargs):
        list_kwargs = {"child_relation": cls(*args, **kwargs)}
        for key in kwargs:
            if key in MANY_RELATION_KWARGS:
                list_kwargs[key] = kwargs[key]

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
