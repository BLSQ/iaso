from django.db import models
from django.db.models import Q
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import OrgUnit, OrgUnitType, Group


class TimestampSerializerMixin:
    """This Mixin override the serialization of the DateTime field to timestamp
    instead of RST default RFC3339

    this is used to stay compatible with older API"""

    serializer_field_mapping = serializers.ModelSerializer.serializer_field_mapping.copy()
    serializer_field_mapping[models.DateTimeField] = TimestampField


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

    This allow us to keep the conversion in one place, subclass if you want to serialize
    less or more field. See OrgUnitSearchParentSerializer for an example

    search_index is a special case. It will be included if asked for in field and if present
    on the instance, to mimic the old behavior
    """

    def __init__(self, instance=None, *args, **kwargs):
        super().__init__(instance, *args, **kwargs)

        if "search_index" in self.fields and not hasattr(instance, "search_index"):
            self.fields.pop("search_index")

    org_unit_type = OrgUnitTypeSerializer()
    groups = GroupSerializer(many=True)
    parent_name = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()
    org_unit_type_name = serializers.SerializerMethodField()
    search_index = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    has_geo_json = serializers.SerializerMethodField()

    # If in a subclass this will correctly use the subclass own serializer
    parent = serializers.SerializerMethodField()

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
            "has_geo_json",
            "search_index",  # May be dynamically removed
            "created_at",
            "org_unit_type_id",
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
        ]


class OrgUnitSearchParentSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent"]


# noinspection PyMethodMayBeStatic
class OrgUnitSearchSerializer(OrgUnitSerializer):
    parent = OrgUnitSearchParentSerializer()
    instances_count = serializers.SerializerMethodField()

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
            "has_geo_json",
            "search_index",  # May be dynamically removed
            "created_at",
            "source_id",
            "org_unit_type",
            "org_unit_type_id",
            "instances_count",
            "updated_at",
            "groups",
        ]


class OrgUnitTreeSearchSerializer(OrgUnitSerializer):
    has_children = serializers.SerializerMethodField()

    # probably a way to optimize that
    def get_has_children(self, org_unit):
        return org_unit.children().exists() if org_unit.path else False

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent", "has_children"]
