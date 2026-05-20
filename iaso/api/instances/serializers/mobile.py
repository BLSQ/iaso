from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.api.instances.serializers.misc import InstanceFileSerializer
from iaso.models import Instance


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
