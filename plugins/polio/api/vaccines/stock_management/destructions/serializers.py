import os

from rest_framework import serializers

from iaso.utils.virus_scan.serializers import ModelWithFileSerializer
from plugins.polio.api.vaccines.permissions import has_vaccine_stock_edit_access
from plugins.polio.models import DestructionReport
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


class DestructionReportSerializer(ModelWithFileSerializer):
    file = serializers.FileField(required=False)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = DestructionReport
        exclude = ["file_last_scan", "file_scan_status"]

    def get_can_edit(self, obj):
        return has_vaccine_stock_edit_access(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )

    def create(self, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.file:
            ret["file"] = {
                "path": instance.file.url,
                "name": os.path.basename(instance.file.name),
            }
        else:
            ret["file"] = None
        return ret
