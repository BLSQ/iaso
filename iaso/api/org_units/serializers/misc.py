import logging

from typing import Any

from rest_framework import serializers

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import ModelSerializer
from iaso.models import Mission, MissionOrgUnitType, OrgUnit, Planning
from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


logger = logging.getLogger(__name__)


class OrgUnitImportSerializer(ModelSerializer):
    """Helper class for the validation and creation of OrgUnit instances from API data."""

    # Map the api's incoming 'id' field to the model's 'uuid' field.
    id = serializers.CharField(source="uuid")

    name = serializers.CharField(required=False, allow_null=True)
    location = ThreeDimPointField(required=False, allow_null=True, write_only=True)

    mission_id = serializers.PrimaryKeyRelatedField(
        queryset=MissionOrgUnitType.objects.none(), write_only=True, required=False, source="mission", allow_null=True
    )
    planning_id = serializers.PrimaryKeyRelatedField(
        queryset=Planning.objects.none(), write_only=True, required=False, source="planning", allow_null=True
    )

    # internal non-model fields
    created_at = serializers.FloatField(required=False, allow_null=True, write_only=True)
    parent_lookup = serializers.CharField(required=False, allow_null=True, write_only=True)
    org_unit_type_id_lookup = serializers.CharField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "location",
            "created_at",
            "parent_lookup",
            "org_unit_type_id_lookup",
            "parent_id",
            "org_unit_type_id",
            "mission_id",
            "planning_id",
        ]
        extra_kwargs = {
            "parent_id": {"required": False},
            "org_unit_type_id": {"required": False},
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = self.context.get("user", None)
        if user:
            self.fields["mission_id"].queryset = Mission.objects_include_deleted.filter_for_user(user=user)
            self.fields["planning_id"].queryset = Planning.objects_include_deleted.filter_for_user(user=user)

    def to_internal_value(self, data):
        """Pre-process the incoming dictionary and handle legacy data formats."""
        processed_data = {}

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if not latitude or not longitude:
            # treat 0, 0 as no location
            processed_data["location"] = None
        else:
            processed_data["location"] = {
                "latitude": latitude,
                "longitude": longitude,
                "altitude": data.get("altitude", 0.0),
            }

        # there exist versions of the mobile app in the wild with both parentId and parent_id
        parent_key = data.get("parentId") or data.get("parent_id")
        if parent_key:
            processed_data["parent_lookup"] = parent_key

        # there exist versions of the mobile app in the wild with both orgUnitTypeId and org_unit_type_id
        type_key = data.get("orgUnitTypeId") or data.get("org_unit_type_id")
        if type_key:
            processed_data["org_unit_type_id_lookup"] = type_key

        processed_data["id"] = data.get("id")
        processed_data["name"] = data.get("name")
        processed_data["created_at"] = data.get("created_at")
        processed_data["planning_id"] = data.get("planning_id", None)
        processed_data["mission_id"] = data.get("mission_id", None)

        return super().to_internal_value(processed_data)

    def validate(self, data: dict) -> dict:
        # Resolve parent passed as id or uuid
        parent_lookup = data.pop("parent_lookup", None)
        if parent_lookup is not None:
            if str.isdigit(parent_lookup):
                data["parent_id"] = int(parent_lookup)
            else:
                try:
                    parent_org_unit = OrgUnit.objects.get(uuid=parent_lookup)
                    data["parent_id"] = parent_org_unit.id
                except OrgUnit.DoesNotExist:
                    raise serializers.ValidationError(
                        {"parent_id": f"Parent OrgUnit with uuid {parent_lookup} not found."}
                    )

        org_unit_type_id = data.pop("org_unit_type_id_lookup", None)
        if org_unit_type_id is not None:
            data["org_unit_type_id"] = org_unit_type_id

        timestamp = data.pop("created_at", None)
        if timestamp:
            try:
                data["source_created_at"] = timestamp_to_utc_datetime(int(timestamp))
            except (ValueError, TypeError):
                raise serializers.ValidationError({"created_at": "Invalid timestamp."})

        mission = data.get("mission")
        user = self.context.get("user", None)

        if mission and user:
            if mission.id not in MissionOrgUnitType.objects_include_deleted.filter_for_user(user=user).values_list(
                "id", flat=True
            ):
                logger.warning(
                    "Unexpected mission type",
                    extra={
                        "model": "OrgUnit",
                        "mission_id": mission.id,
                        "mission_type": mission.MISSION_TYPE,
                        "from": "org_unit_creation",
                        "org_unit_uuid": data.get("uuid"),
                    },
                )
        return data
