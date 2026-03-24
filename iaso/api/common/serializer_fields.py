from datetime import date, datetime

import pytz

from django.utils.timezone import make_aware
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers


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
