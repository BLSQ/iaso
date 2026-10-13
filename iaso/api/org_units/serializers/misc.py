from rest_framework import serializers

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit
from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


class OrgUnitImportSerializer(ModelSerializer):
    """Helper class for the validation and creation of OrgUnit instances from API data."""

    # Map the api's incoming 'id' field to the model's 'uuid' field.
    id = serializers.CharField(source="uuid")

    name = serializers.CharField(required=False, allow_null=True)
    location = ThreeDimPointField(required=False, allow_null=True, write_only=True)

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
        ]
        extra_kwargs = {
            "parent_id": {"required": False},
            "org_unit_type_id": {"required": False},
        }

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

        return super().to_internal_value(processed_data)

    def validate(self, data):
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

        return data
