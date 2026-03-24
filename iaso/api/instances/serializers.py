import decimal

from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import Instance
from iaso.utils.file_utils import get_file_type
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


class InstanceFileSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    file = serializers.FileField(use_url=True)
    file_type = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)

    def get_file_type(self, obj):
        return get_file_type(obj.file)


class MobileInstancesSerializer(serializers.ModelSerializer):
    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True, source="source_updated_at_with_fallback")
    instance_files = InstanceFileSerializer(many=True, read_only=True, source="instancefile_set")

    class Meta:
        model = Instance
        fields = [
            "id",
            "uuid",
            "org_unit_id",
            "form_id",
            "form_version_id",
            "created_at",
            "updated_at",
            "json",
            "instance_files",
        ]
