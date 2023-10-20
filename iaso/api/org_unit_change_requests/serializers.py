from rest_framework import serializers

from iaso.models import OrgUnitChangeRequest
from collections import OrderedDict

from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.utils.translation import gettext_lazy as _


class PointFieldWithAccuracy(serializers.Serializer):
    """
    Expected input:
    {
        "latitude": 49.8782482189424,
        "longitude": 24.452545489,
        "altitude": 5.1,
        "accuracy": 1.2
    }
    """

    default_error_messages = {
        "invalid": _("Enter a valid location."),
    }

    point_field: str = "new_location"
    accuracy_field: str = "new_accuracy"

    def __init(self, point_field="new_location", accuracy_field="new_accuracy"):
        self.point_field = point_field
        self.accuracy_field = accuracy_field

    def to_internal_value(self, value):
        if not value and not self.required:
            return
        try:
            latitude = value.get("latitude")
            longitude = value.get("longitude")
            altitude = value.get("altitude")
            accuracy = value.get("accuracy")
            ret = OrderedDict()
            ret[self.point_field] = GEOSGeometry(f"POINT({longitude} {latitude} {altitude})", srid=4326)
            ret[self.accuracy_field] = accuracy
            return ret
        except (GEOSException, ValueError):
            self.fail("invalid")

    def to_representation(self, instance):
        if hasattr(instance, self.point_field) & hasattr(instance, self.accuracy_field):
            value = getattr(instance, self.point_field)
            if value is None:
                return None
            return {
                "latitude": value.y,
                "longitude": value.x,
                "altitude": value.z,
                "accuracy": getattr(instance, self.accuracy_field),
            }
        return None


class MobileOrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    org_unit_id = serializers.IntegerField(source="org_unit.id", allow_null=True)
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid", allow_null=True)
    new_location = PointFieldWithAccuracy(source="*")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
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
            "new_reference_instances",
        ]


class OrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
    org_unit_name = serializers.CharField(source="org_unit.name")
    org_unit_type_id = serializers.IntegerField(source="org_unit.org_unit_type.id")
    org_unit_type_name = serializers.CharField(source="org_unit.org_unit_type.name")
    groups = serializers.SerializerMethodField(method_name="get_current_org_unit_groups")
    created_by = serializers.CharField(source="created_by.username", default="")
    updated_by = serializers.CharField(source="updated_by.username", default="")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "org_unit_id",
            "org_unit_uuid",
            "org_unit_name",
            "org_unit_type_id",
            "org_unit_type_name",
            "status",
            "groups",
            "requested_fields",
            "approved_fields",
            "rejection_comment",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]

    def get_current_org_unit_groups(self, obj: OrgUnitChangeRequest):
        return [group.name for group in obj.org_unit.groups.all()]
