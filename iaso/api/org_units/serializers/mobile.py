from typing import Any

from django.utils.functional import cached_property
from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.api.instances.serializers import InstanceFileAttachmentSerializer
from iaso.models import Instance, OrgUnit


class ReferenceInstancesSerializer(ModelSerializer):
    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True, source="source_updated_at_with_fallback")
    instance_files = InstanceFileAttachmentSerializer(many=True, read_only=True, source="instancefile_set")

    class Meta:
        model = Instance
        fields = [
            "id",
            "uuid",
            "form_id",
            "form_version_id",
            "created_at",
            "updated_at",
            "json",
            "instance_files",
        ]


class MobileOrgUnitSerializer(ModelSerializer):
    app_id = None

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # Do not include the geo_json if not requested
        self.app_id = kwargs["context"].get("app_id")
        if not kwargs["context"].get("include_geo_json"):
            self.fields.pop("geo_json")

    class Meta:
        model = OrgUnit
        fields = [
            "name",
            "id",
            "parent_id",
            "org_unit_type_id",
            "org_unit_type_name",
            "validation_status",
            "created_at",
            "updated_at",
            "latitude",
            "longitude",
            "altitude",
            "uuid",
            "aliases",
            "code",
            "geo_json",
            "groups",
            "opening_date",
            "closed_date",
        ]

    parent_id = serializers.SerializerMethodField()
    org_unit_type_name = serializers.SerializerMethodField()
    created_at = TimestampField()
    updated_at = TimestampField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()
    geo_json = serializers.JSONField()

    @staticmethod
    def get_org_unit_type_name(org_unit: OrgUnit):
        name_annotated = getattr(org_unit, "org_unit_type_name_annotated", None)
        if name_annotated is not None:
            return name_annotated
        return org_unit.org_unit_type.name if org_unit.org_unit_type else None

    @cached_property
    def valid_org_unit_type_ids(self):
        valid_ids = set()
        project = self.context.get("project")
        if project is not None:
            valid_ids = set(project.unit_types.values_list("id", flat=True))
        return valid_ids

    def get_parent_id(self, org_unit: OrgUnit):
        parent_id = org_unit.parent_id
        if parent_id is None:
            return None

        # Retrieve annotated values if present
        parent_validation_status = getattr(org_unit, "parent_validation_status", None)
        parent_org_unit_type_id = getattr(org_unit, "parent_org_unit_type_id", None)

        if parent_validation_status is None or parent_org_unit_type_id is None:
            parent = org_unit.parent
            if parent is None:
                return None
            parent_validation_status = parent.validation_status
            parent_org_unit_type_id = parent.org_unit_type_id

        if parent_validation_status != OrgUnit.VALIDATION_VALID:
            return None

        if self.app_id is not None:
            project = self.context.get("project")
            if project is not None:
                if parent_org_unit_type_id not in self.valid_org_unit_type_ids:
                    return None
            else:
                raise NotImplementedError("The serializer requires a valid project in its context.")

        return parent_id

    @staticmethod
    def get_latitude(org_unit: OrgUnit):
        return org_unit.location.y if org_unit.location else None

    @staticmethod
    def get_longitude(org_unit: OrgUnit):
        return org_unit.location.x if org_unit.location else None

    @staticmethod
    def get_altitude(org_unit: OrgUnit):
        return org_unit.location.z if org_unit.location else None
