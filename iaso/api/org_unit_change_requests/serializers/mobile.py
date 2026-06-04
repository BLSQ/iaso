from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.api.mobile.org_units import ReferenceInstancesSerializer
from iaso.models import OrgUnitChangeRequest
from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


class MobileOrgUnitChangeRequestListSerializer(ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequest` instances for mobile.
    """

    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
    new_location = ThreeDimPointField()
    created_at = TimestampField()
    updated_at = TimestampField()
    new_reference_instances = ReferenceInstancesSerializer(many=True)

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "org_unit_id",
            "org_unit_uuid",
            "status",
            "approved_fields",
            "rejection_comment",
            "created_at",
            "updated_at",
            "new_parent_id",
            "new_name",
            "new_org_unit_type_id",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_opening_date",
            "new_closed_date",
            "new_reference_instances",
        ]
