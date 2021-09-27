import logging
import sys
from io import StringIO

from rest_framework import serializers

from iaso.diffing import Differ, Dumper
from iaso.management.commands.command_logger import CommandLogger
from iaso.models import SourceVersion, OrgUnit, OrgUnitType

logger = logging.getLogger(__name__)

STATUSES = list(OrgUnit.VALIDATION_STATUS_CHOICES) + [("", "all")]
FIELDS = ["name", "parent", "geometry"]


class DiffSerializer(serializers.Serializer):
    ref_version_id = serializers.PrimaryKeyRelatedField(
        queryset=SourceVersion.objects.all(), style={"base_template": "select.html"}
    )
    source_version_id = serializers.PrimaryKeyRelatedField(
        queryset=SourceVersion.objects.all(), style={"base_template": "select.html"}
    )
    source_status = serializers.ChoiceField(required=False, choices=STATUSES)
    source_top_org_unit_id = serializers.PrimaryKeyRelatedField(required=False, queryset=OrgUnit.objects.all())
    source_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        required=False, queryset=OrgUnitType.objects.all(), many=True, style={"base_template": "select_multiple.html"}
    )
    ref_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        required=False, queryset=OrgUnitType.objects.all(), many=True, style={"base_template": "select_multiple.html"}
    )
    ref_top_org_unit_id = serializers.PrimaryKeyRelatedField(required=False, queryset=OrgUnit.objects.all())
    fields_to_export = serializers.MultipleChoiceField(choices=FIELDS)

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        account = self.context["request"].user.iaso_profile.account
        versions = SourceVersion.objects.filter(data_source__projects__account=account)
        if validated_data["ref_version_id"] not in versions:
            raise serializers.ValidationError({"ref_version_id": ["Unauthorized ref_version_id"]})
        if validated_data["source_version_id"] not in versions:
            raise serializers.ValidationError({"source_version_id": ["Unauthorized source_version_id"]})

        if (
            validated_data.get("source_top_org_unit_id")
            and validated_data["source_top_org_unit_id"].version != validated_data["source_version_id"]
        ):
            raise serializers.ValidationError({"source_top_org_unit_id": ["not in source_version_id"]})
        if (
            validated_data.get("ref_top_org_unit_id")
            and validated_data["ref_top_org_unit_id"].version != validated_data["ref_version_id"]
        ):
            raise serializers.ValidationError({"ref_top_org_unit_id": ["not in ref_version_id"]})

        return validated_data

    def generate_csv(self):
        data = self.validated_data
        print("Validated data", data)
        iaso_logger = CommandLogger(sys.stdout)
        diffs, fields = Differ(iaso_logger).diff(
            data["ref_version_id"],
            data["source_version_id"],
            ignore_groups=False,
            show_deleted_org_units=True,
            validation_status=data.get("source_status"),
            top_org_unit=data.get("source_top_org_unit_id"),
            top_org_unit_ref=data.get("ref_top_org_unit_id"),
            org_unit_types=data.get("source_org_unit_type_ids"),
            org_unit_types_ref=data.get("ref_org_unit_type_ids"),
            field_names=data.get("fields_to_export"),
        )
        buffer = StringIO()
        Dumper(iaso_logger).dump_as_csv(diffs, fields, buffer)
        buffer.seek(0)
        return buffer
