from datetime import datetime
from django.utils.timezone import make_aware
from rest_framework import serializers


class TimestampField(serializers.Field):
    def to_representation(self, value: datetime):
        return value.timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data))
