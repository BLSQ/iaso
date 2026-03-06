import decimal

from rest_framework import serializers

from iaso.utils.serializer.rounded_decimal_field import RoundedDecimalField


class InstanceImportAccuracySerializer(serializers.Serializer):
    accuracy = RoundedDecimalField(
        max_digits=7,
        decimal_places=2,
        rounding=decimal.ROUND_HALF_UP,
        allow_null=True,
        required=False,
    )


class FileTypeSerializer(serializers.Serializer):
    image_only = serializers.BooleanField(default=False)
    video_only = serializers.BooleanField(default=False)
    document_only = serializers.BooleanField(default=False)
    other_only = serializers.BooleanField(default=False)
