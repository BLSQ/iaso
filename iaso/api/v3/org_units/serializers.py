"""Response shaping for `/api/v3/orgunits/`.

The serializers below are the single declaration of what `fields=` accepts: `DynamicFieldsMixin` prunes
them to the requested fields, and `optimize_queryset` derives `.only()`/`select_related`/`Prefetch` from
each remaining field's `source` - see `iaso.api.v3.common.dynamic_fields`.
"""

import json

from typing import List

from django.contrib.gis.db.models.functions import AsGeoJSON
from django.db.models import BooleanField, ExpressionWrapper, F, Func, IntegerField, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.v3.common.dynamic_fields import BatchLoader, DynamicFieldsMixin, only_columns
from iaso.models import OrgUnit

from .expressions import LOCATED, Extent, LocatedExtent, bbox_properties, has_children, located_descendants_count


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


def has_geo_json():
    return ExpressionWrapper(Q(geom__isnull=False) | Q(simplified_geom__isnull=False), output_field=BooleanField())


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
        "has_geo_json": {"has_geo_json": has_geo_json()},
        "has_geometry": {"has_geometry": ExpressionWrapper(LOCATED, output_field=BooleanField())},
        "has_children": {"has_children": has_children()},
        "located_descendants": {"located_descendants": located_descendants_count()},
        "bbox": {"bbox": Extent()},
        "located_bbox": {"located_bbox": LocatedExtent()},
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
    has_geometry = serializers.BooleanField(help_text="Has a location or a shape: something to draw on a map")
    has_children = serializers.BooleanField(help_text="Has at least one child, located or not")
    located_descendants = serializers.IntegerField(help_text="Number of located org units below this one")
    bbox = serializers.ListField(
        child=serializers.FloatField(),
        allow_null=True,
        help_text="`[xmin, ymin, xmax, ymax]` of the org unit itself (its full shape, else its point), to fit a "
        "map to it - null if it isn't located",
    )
    located_bbox = serializers.ListField(
        child=serializers.FloatField(),
        allow_null=True,
        help_text="`[xmin, ymin, xmax, ymax]` of this org unit and its located descendants, null if none is located",
    )
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


class BboxPropertiesField(serializers.Field):
    """Spread over 4 tile properties (see `bbox_properties`)."""

    shape = "4 properties: bbox_xmin, bbox_ymin, bbox_xmax, bbox_ymax"

    def __init__(self, **kwargs):
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)


class OrgUnitTileFeatureSerializerV3(DynamicFieldsMixin, serializers.Serializer):
    """The properties of an org unit feature in `/api/v3/orgunits/tiles/{z}/{x}/{y}/`: what `fields=` accepts
    there. Never used to serialize rows - the tile is encoded by postgres (see `iaso.api.v3.common.mvt`) - so
    every field is a model column (its `source`) or an entry of `annotations`, and none can be nested: a vector
    tile only holds scalar properties. Keep the defaults small, every property is repeated in every feature: `id`
    isn't one of them, the MVT feature id already is the org unit id (MapLibre's `feature.id`)."""

    default_fields = ("name", "validation_status", "org_unit_type_id", "parent_id")
    annotations = {
        "has_geo_json": {"has_geo_json": has_geo_json()},
        "has_children": {"has_children": has_children()},
        "depth": {"depth": Func(F("path"), function="nlevel", output_field=IntegerField())},
        "bbox": bbox_properties(),
        # aliased by the `ancestor_id__closest_located` filter (see `OrgUnitViewSetV3.tiles`)
        "via_id": {"via_id": F("closest_located_via_id")},
        "via_name": {"via_name": F("closest_located_via_name")},
    }
    #: fields only available with that filter
    requires_closest_located = ("via_id", "via_name")

    id = serializers.IntegerField(help_text="Also the MVT feature id: only needed by clients that ignore it")
    name = serializers.CharField()
    uuid = serializers.CharField(allow_null=True)
    validation_status = serializers.CharField()
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    parent_id = serializers.IntegerField(allow_null=True)
    source_ref = serializers.CharField(allow_null=True)
    code = serializers.CharField(allow_blank=True)
    depth = serializers.IntegerField(help_text="ltree path depth, root = 1")
    has_geo_json = serializers.BooleanField()
    has_children = serializers.BooleanField(help_text="Has at least one child, located or not")
    bbox = BboxPropertiesField(help_text="Full (unclipped) extent of the org unit, to fit the map to it")
    via_id = serializers.IntegerField(
        allow_null=True,
        help_text="With `ancestor_id__closest_located`: the child of that org unit this feature stands in for, "
        "null for its direct children",
    )
    via_name = serializers.CharField(allow_null=True, help_text="Name of `via_id`")


class TileJSONSerializerV3(serializers.Serializer):
    """TileJSON 3.0.0 of the org unit vector tiles (https://github.com/mapbox/tilejson-spec) - for the API docs."""

    tilejson = serializers.CharField(help_text="TileJSON version")
    tiles = serializers.ListField(
        child=serializers.CharField(), help_text="Tile url template, with the query params of the request"
    )
    minzoom = serializers.IntegerField()
    maxzoom = serializers.IntegerField(help_text="Past it, clients overzoom the tiles")
    bounds = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="`[west, south, east, north]` of the matching org units, left out when none is located",
    )
    vector_layers = serializers.ListField(
        child=serializers.DictField(), help_text="The tile layer: its `id` and `fields` (property -> description)"
    )
    count = serializers.IntegerField(help_text="How many org units match (located or not)")
    located_count = serializers.IntegerField(help_text="How many of them have a location or a shape")
    fit_bounds = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="`[west, south, east, north]` to fit the map to: `bounds` without the far outliers",
    )
    outside_fit_bounds = serializers.IntegerField(help_text="How many located org units `fit_bounds` leaves out")
