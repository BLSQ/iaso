from django.db import models
from django.db.models import Q
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import OrgUnit, OrgUnitType, Group


class AppIdSerializer(serializers.Serializer):
    app_id = serializers.CharField(allow_blank=False)


class TimestampSerializerMixin:
    """This Mixin override the serialization of the DateTime field to timestamp
    instead of RST default RFC3339

    this is used to stay compatible with older API"""

    serializer_field_mapping = serializers.ModelSerializer.serializer_field_mapping.copy()
    serializer_field_mapping[models.DateTimeField] = TimestampField  # type: ignore


class GroupSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "source_ref", "source_version", "created_at", "updated_at"]


class OrgUnitTypeSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "created_at", "updated_at", "depth"]


# noinspection PyMethodMayBeStatic
class OrgUnitSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    """Master Serializer for OrgUnit

    This allows us to keep the conversion in one place, subclass if you want to serialize
    less or more field. See OrgUnitSearchParentSerializer for an example
    """

    org_unit_type = OrgUnitTypeSerializer()
    groups = GroupSerializer(many=True)
    parent_name = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    source = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    org_unit_type_name = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    search_index = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    has_geo_json = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()

    # If in a subclass this will correctly use the subclass own serializer
    parent = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4

    @classmethod
    def get_parent(cls, org_unit):
        return cls(org_unit.parent).data if org_unit.parent else None

    def get_parent_name(self, org_unit):
        return org_unit.parent.name if org_unit.parent else None

    def get_source(self, org_unit):
        return org_unit.version.data_source.name if org_unit.version else None

    def get_org_unit_type_name(self, org_unit):
        return org_unit.org_unit_type.name if org_unit.org_unit_type else None

    def get_search_index(self, org_unit):
        return getattr(org_unit, "search_index", None)

    def get_source_id(self, org_unit):
        return org_unit.version.data_source.id if org_unit.version else None

    def get_has_geo_json(self, org_unit):
        return True if org_unit.simplified_geom else False

    def get_latitude(self, org_unit):
        return org_unit.location.y if org_unit.location else None

    def get_longitude(self, org_unit):
        return org_unit.location.x if org_unit.location else None

    def get_altitude(self, org_unit):
        return org_unit.location.z if org_unit.location else None

    def get_creator(self, org_unit):
        creator = None
        if org_unit.creator is not None:
            if org_unit.creator.first_name is not None and org_unit.creator.last_name is not None:
                creator = f"{org_unit.creator.username} ( {org_unit.creator.first_name} {org_unit.creator.last_name} )"
            else:
                creator = org_unit.creator.username
        return creator

    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "aliases",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "sub_source",
            "org_unit_type_name",
            "parent",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "search_index",
            "created_at",
            "org_unit_type_id",
            "creator",
        ]


class OrgUnitSmallSearchSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "org_unit_type_name",
            "search_index",
            "parent",
            "creator",
        ]


class OrgUnitSearchParentSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent"]


class OrgUnitDropdownSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = ["value", "label"]

    label = serializers.CharField(source="name", read_only=True)  # type: ignore
    value = serializers.IntegerField(source="id", read_only=True)


# noinspection PyMethodMayBeStatic
class OrgUnitSearchSerializer(OrgUnitSerializer):
    parent = OrgUnitSearchParentSerializer()
    instances_count = serializers.SerializerMethodField()
    creator = serializers.SerializerMethodField()

    def get_instances_count(self, org_unit):
        # in some case instances_count is prefilled by an annotation
        if hasattr(org_unit, "instances_count"):
            return org_unit.instances_count
        else:
            return org_unit.instance_set.filter(~Q(file="") & ~Q(device__test_device=True) & ~Q(deleted=True)).count()

    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "aliases",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "sub_source",
            "org_unit_type_name",
            "parent",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "search_index",
            "created_at",
            "source_id",
            "org_unit_type",
            "org_unit_type_id",
            "instances_count",
            "updated_at",
            "groups",
            "creator",
        ]


# noinspection PyMethodMayBeStatic
class OrgUnitTreeSearchSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    # If in a subclass this will correctly use the subclass own serializer

    has_children = serializers.SerializerMethodField()

    @classmethod
    def get_has_children(cls, org_unit):
        return org_unit.children_count > 0

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "validation_status", "has_children", "org_unit_type_id"]
