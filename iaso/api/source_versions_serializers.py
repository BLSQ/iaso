import logging
import sys
from io import StringIO

from rest_framework import serializers

from iaso.diffing import Differ, Dumper
from iaso.management.commands.command_logger import CommandLogger
from iaso.models import SourceVersion, OrgUnit, OrgUnitType, Task
from iaso.tasks.dhis2_ou_exporter import dhis2_ou_exporter

logger = logging.getLogger(__name__)

STATUSES = list(OrgUnit.VALIDATION_STATUS_CHOICES) + [("", "all")]
FIELDS = ["name", "parent", "geometry", "groups"]


class DiffSerializer(serializers.Serializer):
    ref_version_id = serializers.PrimaryKeyRelatedField(
        queryset=SourceVersion.objects.all(), style={"base_template": "select.html"}
    )
    source_version_id = serializers.PrimaryKeyRelatedField(
        queryset=SourceVersion.objects.all(), style={"base_template": "select.html"}
    )
    source_status = serializers.ChoiceField(required=False, choices=STATUSES)
    source_top_org_unit_id = serializers.PrimaryKeyRelatedField(
        required=False, default=None, queryset=OrgUnit.objects.all(), allow_null=True
    )
    source_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        required=False,
        default=[],
        queryset=OrgUnitType.objects.all(),
        many=True,
        style={"base_template": "select_multiple.html"},
    )
    ref_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        required=False,
        default=[],
        queryset=OrgUnitType.objects.all(),
        many=True,
        style={"base_template": "select_multiple.html"},
    )
    ref_top_org_unit_id = serializers.PrimaryKeyRelatedField(
        required=False, default=None, queryset=OrgUnit.objects.all(), allow_null=True
    )
    ref_status = serializers.ChoiceField(required=False, choices=STATUSES)
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

        if validated_data.get("fields_to_export"):
            validated_data["fields_to_export"] = list(validated_data["fields_to_export"])

        return validated_data

    def generate_csv(self):
        data = self.validated_data
        iaso_logger = CommandLogger(sys.stdout)
        if "groups" in data["fields_to_export"]:
            data["fields_to_export"].remove("groups")
            ignore_groups = False
        else:
            ignore_groups = True

        diffs, fields = Differ(iaso_logger).diff(
            data["ref_version_id"],
            data["source_version_id"],
            ignore_groups=ignore_groups,
            show_deleted_org_units=True,
            validation_status=data.get("source_status"),
            validation_status_ref=data.get("ref_status"),
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


class ExportSerializer(DiffSerializer):
    # use same field as diff serializer
    def validate(self, attrs):
        validated_data = super().validate(attrs)
        source_version = validated_data["source_version_id"]
        credentials = source_version.data_source.credentials
        if not (credentials and credentials.is_valid):
            raise serializers.ValidationError({"source_version_id": ["No valid DHIS2 configured on source"]})
        return validated_data

    def launch_export(self, user):
        # use data and not validated data, so we have the id
        data = self.data
        if "groups" in data["fields_to_export"]:
            data["fields_to_export"].remove("groups")
            ignore_groups = False
        else:
            ignore_groups = True

        task: Task = dhis2_ou_exporter(
            ref_version_id=data["ref_version_id"],
            version_id=data["source_version_id"],
            ignore_groups=ignore_groups,
            show_deleted_org_units=True,
            validation_status=data.get("source_status"),
            ref_validation_status=data.get("ref_status"),
            top_org_unit_id=data.get("source_top_org_unit_id"),
            top_org_unit_ref_id=data.get("ref_top_org_unit_id"),
            org_unit_types_ids=data.get("source_org_unit_type_ids"),
            org_unit_types_ref_ids=data.get("ref_org_unit_type_ids"),
            field_names=list(data["fields_to_export"]),
            user=user,
        )

        return task
