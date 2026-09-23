"""Response shaping for `/api/v3/orgunits/`.

The serializers below are the single declaration of what `fields=` accepts: `DynamicFieldsMixin` prunes
them to the requested fields, and `optimize_queryset` derives `.only()`/`select_related`/`Prefetch` from
each remaining field's `source` - see `iaso.api.v3.common.dynamic_fields`.
"""

import json

from typing import List

from django.contrib.gis.db.models.functions import AsGeoJSON
from django.db.models import BooleanField, ExpressionWrapper, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.v3.common.dynamic_fields import BatchLoader, DynamicFieldsMixin, only_columns
from iaso.models import OrgUnit


@extend_schema_field(OpenApiTypes.OBJECT)
class GeoJSONField(serializers.Field):
    """Reads an `AsGeoJSON(...)` annotation (see `OrgUnitSerializerV3.annotations`)."""

    shape = "GeoJSON"

    def __init__(self, **kwargs):
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)

    def to_representation(self, value):
        return json.loads(value)


class LtreeDepthField(serializers.IntegerField):
    """ltree path depth, root = 1 - the value the `depth` filter matches against."""

    def to_representation(self, value):
        return len(value)


@extend_schema_field(OpenApiTypes.INT)
class IdRelatedField(serializers.PrimaryKeyRelatedField):
    """A related object's bare id - typed for drf-spectacular, which can't infer it without a `Meta.model`."""


class EmptyListIfNullField(serializers.ListField):
    def get_attribute(self, instance):
        return super().get_attribute(instance) or []


class OrgUnitSummarySerializerV3(DynamicFieldsMixin, serializers.Serializer):
    """One `ancestors(...)` entry, and `parent(...)`."""

    default_fields = ("id", "name", "source_ref", "org_unit_type_id")

    id = serializers.IntegerField()
    name = serializers.CharField()
    source_ref = serializers.CharField(allow_null=True)
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    validation_status = serializers.CharField()
    parent_id = serializers.IntegerField(allow_null=True)


class GroupSerializerV3(DynamicFieldsMixin, serializers.Serializer):
    """One entry of the default `groups` field. Request `group_ids` instead for just the bare ids."""

    allow_sub_selector = False

    id = serializers.IntegerField()
    name = serializers.CharField()


class OrgUnitTypeSummarySerializerV3(DynamicFieldsMixin, serializers.Serializer):
    allow_sub_selector = False

    id = serializers.IntegerField()
    name = serializers.CharField()
    short_name = serializers.CharField()
    category = serializers.CharField(allow_null=True)


class CreatorSummarySerializerV3(DynamicFieldsMixin, serializers.Serializer):
    """`null` for org units with no recorded creator."""

    allow_sub_selector = False

    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    email = serializers.CharField(allow_blank=True)


class DataSourceSummarySerializerV3(DynamicFieldsMixin, serializers.Serializer):
    allow_sub_selector = False

    id = serializers.IntegerField()
    name = serializers.CharField()


class VersionSummarySerializerV3(DynamicFieldsMixin, serializers.Serializer):
    """`data_source` is opt-in: `version(data_source)`."""

    default_fields = ("id", "number", "data_source_id")

    id = serializers.IntegerField()
    number = serializers.IntegerField()
    data_source_id = serializers.IntegerField(allow_null=True)
    data_source = DataSourceSummarySerializerV3(allow_null=True)


def attach_ancestors(org_units: List[OrgUnit], summary_serializer) -> None:
    """ltree `path` isn't a Django relation, so `ancestors` is batch-loaded here: one query for every
    ancestor of every org unit in `org_units`, ordered root first."""

    def ancestor_ids(unit):
        return [int(ancestor_id) for ancestor_id in unit.path[:-1]] if unit.path else []

    wanted_ids = {ancestor_id for unit in org_units for ancestor_id in ancestor_ids(unit)}
    columns = only_columns(OrgUnit, summary_serializer)
    by_id = OrgUnit.objects.only(*columns).in_bulk(wanted_ids) if wanted_ids else {}
    for unit in org_units:
        unit.v3_ancestors = [by_id[ancestor_id] for ancestor_id in ancestor_ids(unit) if ancestor_id in by_id]


class OrgUnitSerializerV3(DynamicFieldsMixin, serializers.Serializer):
    default_fields = (
        "id",
        "name",
        "uuid",
        "validation_status",
        "parent_id",
        "source_ref",
        "code",
        "aliases",
        "opening_date",
        "closed_date",
        "created_at",
        "updated_at",
        "has_geo_json",
        "latitude",
        "longitude",
        "altitude",
        "org_unit_type_id",
        "groups",
        "depth",
    )
    annotations = {
        "has_geo_json": {
            "has_geo_json": ExpressionWrapper(
                Q(geom__isnull=False) | Q(simplified_geom__isnull=False), output_field=BooleanField()
            )
        },
        "geom": {"geom_geojson": AsGeoJSON("geom")},
        "simplified_geom": {"simplified_geom_geojson": AsGeoJSON("simplified_geom")},
        "catchment": {"catchment_geojson": AsGeoJSON("catchment")},
    }
    batch_loaders = {"ancestors": BatchLoader(attach_ancestors, requires=("path",))}

    id = serializers.IntegerField()
    name = serializers.CharField()
    uuid = serializers.CharField(allow_null=True)
    validation_status = serializers.CharField()
    parent_id = serializers.IntegerField(allow_null=True)
    source_ref = serializers.CharField(allow_null=True)
    code = serializers.CharField(allow_blank=True)
    aliases = EmptyListIfNullField(child=serializers.CharField())
    opening_date = serializers.DateField(allow_null=True)
    closed_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    source_created_at = serializers.DateTimeField(allow_null=True, help_text="Creation time on the client device")
    has_geo_json = serializers.BooleanField()
    latitude = serializers.FloatField(source="location.y", allow_null=True)
    longitude = serializers.FloatField(source="location.x", allow_null=True)
    altitude = serializers.FloatField(source="location.z", allow_null=True)
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    depth = LtreeDepthField(source="path", allow_null=True, help_text="ltree path depth, root = 1")
    groups = GroupSerializerV3(many=True)
    group_ids = IdRelatedField(source="groups", many=True, read_only=True)
    geom = GeoJSONField(source="geom_geojson", allow_null=True)
    simplified_geom = GeoJSONField(source="simplified_geom_geojson", allow_null=True)
    catchment = GeoJSONField(source="catchment_geojson", allow_null=True)
    ancestors = OrgUnitSummarySerializerV3(source="v3_ancestors", many=True)
    parent = OrgUnitSummarySerializerV3(allow_null=True, help_text="Same shape as one `ancestors(...)` entry")
    org_unit_type = OrgUnitTypeSummarySerializerV3(allow_null=True)
    creator = CreatorSummarySerializerV3(allow_null=True)
    version = VersionSummarySerializerV3(allow_null=True)
