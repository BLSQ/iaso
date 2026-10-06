import math
import struct

from unittest import mock

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.db.models import Func, IntegerField

from iaso import models as m
from iaso.api.v3.common.mvt import (
    AUTO_CLUSTER_PX,
    CLUSTER_MAX_ZOOM,
    INDEX_PREFILTER_MIN_ZOOM,
    MVT_MEDIA_TYPE,
    TILE_CACHE_MAX_AGE,
    TILE_SOURCE_MAX_ZOOM,
    Tile,
)
from iaso.api.v3.org_units.expressions import drawn_geometry

from .base import BASE_URL, OrgUnitV3TestCase


# -- a minimal MVT (protobuf) decoder, enough to check what a tile holds -----------------------------------


def _varint(buf, i):
    shift = result = 0
    while True:
        byte = buf[i]
        i += 1
        result |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return result, i
        shift += 7


def _messages(buf):
    """(field number, value) pairs of a protobuf message - bytes for length-delimited values."""
    i = 0
    while i < len(buf):
        key, i = _varint(buf, i)
        field, wire_type = key >> 3, key & 7
        if wire_type == 0:
            value, i = _varint(buf, i)
        elif wire_type == 2:
            size, i = _varint(buf, i)
            value, i = buf[i : i + size], i + size
        elif wire_type == 1:
            value, i = buf[i : i + 8], i + 8
        elif wire_type == 5:
            value, i = buf[i : i + 4], i + 4
        else:
            raise ValueError(f"unsupported wire type {wire_type}")
        yield field, value


def _packed(buf):
    values, i = [], 0
    while i < len(buf):
        value, i = _varint(buf, i)
        values.append(value)
    return values


def _value(buf):
    for field, value in _messages(buf):
        if field == 1:
            return value.decode()
        if field == 2:
            return struct.unpack("<f", value)[0]
        if field == 3:
            return struct.unpack("<d", value)[0]
        if field in (4, 5):
            return value
        if field == 6:
            return (value >> 1) ^ -(value & 1)
        if field == 7:
            return bool(value)
    return None


GEOMETRY_TYPES = {1: "Point", 2: "LineString", 3: "Polygon"}


def decode_tile(content: bytes, as_list: bool = False) -> dict:
    """{layer name: {feature id: {"properties": {...}, "type": "Point"|..., "geometry_size": <encoded ints>}}} - or
    with `as_list`, {layer name: [{"id": ..., "properties": ..., ...}]}, for features without id (clusters)."""
    layers = {}
    for field, layer in _messages(content):
        if field != 3:
            continue
        name, keys, values, raw_features = None, [], [], []
        for layer_field, value in _messages(layer):
            if layer_field == 1:
                name = value.decode()
            elif layer_field == 2:
                raw_features.append(value)
            elif layer_field == 3:
                keys.append(value.decode())
            elif layer_field == 4:
                values.append(_value(value))
        features = [] if as_list else {}
        for raw in raw_features:
            feature_id, properties, geometry_type, geometry_size = None, {}, None, 0
            for feature_field, value in _messages(raw):
                if feature_field == 1:
                    feature_id = value
                elif feature_field == 2:
                    tags = _packed(value)
                    properties = {keys[k]: values[v] for k, v in zip(tags[::2], tags[1::2])}
                elif feature_field == 3:
                    geometry_type = GEOMETRY_TYPES.get(value)
                elif feature_field == 4:
                    # draw commands and their coordinates: grows with the number of vertices
                    geometry_size = len(_packed(value))
            feature = {"properties": properties, "type": geometry_type, "geometry_size": geometry_size}
            if as_list:
                features.append({"id": feature_id, **feature})
            else:
                features[feature_id] = feature
        layers[name] = features
    return layers


def tile_for(z, lng, lat):
    n = 2**z
    x = int((lng + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return z, x, y


# The Star Wars org units are all in the 0..10 lon/lat square: tile 1/1/0 (north-east quarter) holds them - and
# Wakanda (20..30), which must never show up for their user.
FIXTURE_TILE = (1, 1, 0)
EMPTY_TILE = (2, 0, 3)  # south of the south Pacific


class TileRequestsMixin:
    def tile_url(self, z, x, y):
        return f"{BASE_URL}tiles/{z}/{x}/{y}/"

    def get_tile(self, params=None, tile=FIXTURE_TILE, **headers):
        response = self.client.get(self.tile_url(*tile), params or {}, **headers)
        self.assertEqual(response.status_code, 200, response.content[:500])
        self.assertEqual(response["Content-Type"], MVT_MEDIA_TYPE)
        return response

    def get_features(self, params=None, tile=FIXTURE_TILE):
        layers = decode_tile(self.get_tile(params, tile).content)
        return layers.get("org_units", {})

    def get_tile_error(self, params=None, tile=FIXTURE_TILE, status_code=400):
        return self.assertJSONResponse(self.client.get(self.tile_url(*tile), params or {}), status_code)


class OrgUnitV3TilesTestCase(TileRequestsMixin, OrgUnitV3TestCase):
    """`GET /api/v3/orgunits/tiles/{z}/{x}/{y}/`"""

    # -- content --

    def test_draws_located_org_units_with_the_default_properties(self):
        features = self.get_features()
        # the org units without a location or shape have nothing to draw
        self.assertEqual(set(features), {self.country.id, self.region.id})
        self.assertEqual(features[self.country.id]["type"], "Polygon")
        self.assertEqual(features[self.region.id]["type"], "Point")
        # the feature id is the org unit id, so `id` isn't repeated as a property; null values are left out
        self.assertEqual(
            features[self.region.id]["properties"],
            {
                "name": "Theed",
                "validation_status": "VALID",
                "org_unit_type_id": self.region_type.id,
                "parent_id": self.country.id,
            },
        )
        self.assertNotIn("parent_id", features[self.country.id]["properties"])

    def test_tile_outside_the_org_units_is_empty(self):
        response = self.get_tile(tile=EMPTY_TILE)
        self.assertEqual(response.content, b"")

    def test_high_zoom_tile_uses_the_index_prefilter_and_keeps_the_org_units(self):
        tile = tile_for(INDEX_PREFILTER_MIN_ZOOM + 3, 5, 5)
        self.assertIn(self.region.id, self.get_features(tile=tile))
        # the country square overlaps every tile inside it
        self.assertIn(self.country.id, self.get_features(tile=tile))

    def test_is_private_and_not_cached_by_shared_caches(self):
        response = self.get_tile()
        self.assertEqual(response["Cache-Control"], "private, no-cache")
        # another user signing in on the same browser doesn't get them
        self.assertIn("Cookie", response["Vary"])
        self.assertIn("Authorization", response["Vary"])

    def test_cache_key_lets_the_browser_reuse_the_tile(self):
        response = self.get_tile({"cache_key": "k1"})
        self.assertEqual(response["Cache-Control"], f"private, max-age={TILE_CACHE_MAX_AGE}")
        self.assertIn("Cookie", response["Vary"])
        # only a cache buster: same tile
        self.assertEqual(response.content, self.get_tile().content)

    def test_cache_key_is_for_tiles_only(self):
        response = self.client.get(BASE_URL, {"cache_key": "k1"})
        self.assertEqual(response.status_code, 400)

    def test_errors_are_never_cached(self):
        response = self.client.get(self.tile_url(*FIXTURE_TILE), {"cache_key": "k1", "not_a_param": "1"})
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("max-age", response.get("Cache-Control", ""))

    def test_ignores_the_accept_header_of_map_clients(self):
        response = self.get_tile(HTTP_ACCEPT="application/x-protobuf")
        self.assertIn(self.region.id, decode_tile(response.content)["org_units"])

    # -- scoping --

    def test_never_shows_another_accounts_org_units(self):
        marvel_version_id = self.marvel_org_unit.version_id
        wakanda_tile = tile_for(4, 25, 25)
        self.assertEqual(self.get_features(tile=wakanda_tile), {})
        # not even when asking for that account's version explicitly
        self.assertEqual(self.get_features({"version_id": marvel_version_id}, tile=wakanda_tile), {})

        self.assertNotIn(self.marvel_org_unit.id, self.get_features())

        self.client.force_authenticate(self.other_account_user)
        self.assertEqual(set(self.get_features(tile=wakanda_tile)), {self.marvel_org_unit.id})
        self.assertEqual(set(self.get_features()), {self.marvel_org_unit.id})

    def test_restricted_user_only_sees_their_sub_pyramid(self):
        self.user.iaso_profile.org_units.set([self.region])
        self.assertEqual(set(self.get_features()), {self.region.id})

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.tile_url(*FIXTURE_TILE))
        self.assertIn(response.status_code, (401, 403))
        self.assertEqual(response["Content-Type"], "application/json")

    # -- filters --

    def test_takes_the_list_filters(self):
        self.assertEqual(set(self.get_features({"org_unit_type_id": self.region_type.id})), {self.region.id})
        self.assertEqual(set(self.get_features({"validation_status__in": "NEW,REJECTED"})), set())
        self.assertEqual(set(self.get_features({"parent_id": self.country.id})), {self.region.id})
        self.assertEqual(set(self.get_features({"id": self.country.id})), {self.country.id})

    def test_roots_for_user(self):
        # the top of the pyramid: Tatooine and Côte d'Ivoire are roots too, but have nothing to draw
        self.assertEqual(set(self.get_features({"roots_for_user": "true"})), {self.country.id})
        self.user.iaso_profile.org_units.set([self.region])
        self.assertEqual(set(self.get_features({"roots_for_user": "true"})), {self.region.id})

    def test_rejects_unknown_params_with_suggestions(self):
        error = self.get_tile_error({"validation_statuss": "VALID"})
        self.assertEqual(error["suggestions"]["validation_statuss"][0], "validation_status")

    def test_rejects_invalid_filter_values(self):
        self.get_tile_error({"org_unit_type_id": "abc"})
        self.get_tile_error({"validation_status": "MAYBE"})

    def test_rejects_other_formats(self):
        error = self.get_tile_error({"format": "json"})
        self.assertEqual(error["detail"], "Allowed values: mvt.")

    def test_rejects_invalid_tiles(self):
        self.assertIn("between 0 and 1", self.get_tile_error(tile=(1, 2, 0))["detail"])
        self.get_tile_error(tile=(25, 0, 0))

    # -- fields= --

    def test_fields_selects_the_properties(self):
        features = self.get_features({"fields": "id,name,depth,has_children,has_geo_json,code"})
        self.assertEqual(
            features[self.region.id]["properties"],
            {
                "id": self.region.id,
                "name": "Theed",
                "depth": 2,
                "has_children": True,
                "has_geo_json": False,
                "code": "R1",
            },
        )
        self.assertEqual(features[self.country.id]["properties"]["has_geo_json"], True)

    def test_bbox_is_the_unclipped_extent(self):
        # a tile strictly inside the country square: the bbox is still the whole square
        features = self.get_features({"fields": "bbox"}, tile=tile_for(6, 5, 5))
        bbox = features[self.country.id]["properties"]
        self.assertEqual(
            [round(bbox[key], 6) for key in ("bbox_xmin", "bbox_ymin", "bbox_xmax", "bbox_ymax")], [0, 0, 10, 10]
        )
        region_bbox = features[self.region.id]["properties"]
        self.assertEqual((region_bbox["bbox_xmin"], region_bbox["bbox_ymax"]), (5, 5))

    def test_rejects_unknown_or_nested_fields(self):
        self.assertIn("Unknown field", self.get_tile_error({"fields": "name,geom"})["error"])
        self.assertIn("sub-selector", self.get_tile_error({"fields": "bbox(xmin)"})["error"])

    def test_via_needs_the_closest_located_filter(self):
        self.assertIn("ancestor_id__closest_located", self.get_tile_error({"fields": "via_id"})["error"])

    def test_query_count(self):
        # the whole tile is one query, whatever the properties. The others: `filter_for_user` checks the user's
        # org units (twice: for the tile, and for resolving the opened org unit, like `ancestor_id`) and that
        # resolution itself. The profile and account are already loaded on the test user. The tile query runs
        # in a transaction of its own, for its settings (`settings_cursor`): in a request, one more query sets
        # them; here, within the test's transaction, a savepoint also reads and puts back the previous ones.
        with self.assertNumQueries(9):
            self.get_tile({"fields": "name,has_children,bbox,via_id", "ancestor_id__closest_located": self.country.id})


class OrgUnitV3TileJSONTestCase(OrgUnitV3TestCase):
    """`GET /api/v3/orgunits/tilejson/`: what a map needs to use the tiles on their own."""

    def get_tilejson(self, params=None):
        return self.get_json(params, url=f"{BASE_URL}tilejson/")

    def test_describes_the_tiles_of_the_same_query(self):
        tilejson = self.get_tilejson({"org_unit_type_id": self.country_type.id, "fields": "name,bbox"})
        self.assertEqual(tilejson["tilejson"], "3.0.0")
        self.assertEqual(
            tilejson["tiles"],
            [
                f"http://testserver{BASE_URL}tiles/{{z}}/{{x}}/{{y}}/"
                f"?org_unit_type_id={self.country_type.id}&fields=name,bbox"
            ],
        )
        self.assertEqual((tilejson["minzoom"], tilejson["maxzoom"]), (0, TILE_SOURCE_MAX_ZOOM))
        self.assertEqual(
            tilejson["vector_layers"][0]["fields"],
            {
                "name": "String",
                **dict.fromkeys(("bbox_xmin", "bbox_ymin", "bbox_xmax", "bbox_ymax"), mock.ANY),
            },
        )
        self.assertEqual(tilejson["vector_layers"][0]["id"], "org_units")

    def test_counts_the_matching_and_the_located_org_units(self):
        tilejson = self.get_tilejson({"version_id": self.sw_version_1.id})
        self.assertEqual((tilejson["count"], tilejson["located_count"]), (5, 2))

    def test_fit_bounds_leave_out_the_far_outliers(self):
        # 40 points spread in the country square, and a facility geolocated on another continent
        for i in range(40):
            m.OrgUnit.objects.create(
                org_unit_type=self.district_type,
                version=self.sw_version_1,
                name=f"Village {i}",
                location=Point(x=1 + (i % 8), y=1 + (i // 8), z=0),
            )
        tilejson = self.get_tilejson({"org_unit_type_id": self.district_type.id})
        self.assertEqual(tilejson["fit_bounds"], [1, 1, 8, 5])
        self.assertEqual(tilejson["outside_fit_bounds"], 0)
        self.create_misplaced_facility(self.region)  # at (50, 50)
        tilejson = self.get_tilejson({"org_unit_type_id": self.district_type.id})
        # tiles may still hold it...
        self.assertEqual(tilejson["bounds"], [1, 1, 50, 50])
        # ...but the map shouldn't look at a whole continent for it
        self.assertEqual(tilejson["fit_bounds"], [1, 1, 8, 5])
        self.assertEqual(tilejson["outside_fit_bounds"], 1)

    def test_fit_bounds_of_a_few_org_units_are_their_bounds(self):
        tilejson = self.get_tilejson()
        self.assertEqual(tilejson["fit_bounds"], tilejson["bounds"])
        self.assertNotIn("fit_bounds", self.get_tilejson({"id": self.district.id}))

    def test_cluster_is_passed_on_and_describes_the_point_count(self):
        tilejson = self.get_tilejson({"id": self.region.id, "cluster": "40"})
        self.assertTrue(tilejson["tiles"][0].endswith("&cluster=40"))
        self.assertIn("point_count", tilejson["vector_layers"][0]["fields"])
        self.get_json({"cluster": "0"}, 400, url=f"{BASE_URL}tilejson/")

    def test_counts_per_org_unit_type(self):
        tilejson = self.get_tilejson({"version_id": self.sw_version_1.id})
        # the most frequent first, then by id
        self.assertEqual(
            tilejson["org_unit_types"],
            [
                {"id": self.country_type.id, "name": "Country", "depth": None, "count": 3, "located_count": 1},
                {"id": self.region_type.id, "name": "Region", "depth": None, "count": 1, "located_count": 1},
                {"id": self.district_type.id, "name": "District", "depth": None, "count": 1, "located_count": 0},
            ],
        )

    def test_counts_org_unit_without_type(self):
        m.OrgUnit.objects.create(version=self.sw_version_1, name="Untyped", location=Point(1, 1, 0))
        org_unit_types = self.get_tilejson({"version_id": self.sw_version_1.id})["org_unit_types"]
        self.assertIn({"id": None, "name": None, "depth": None, "count": 1, "located_count": 1}, org_unit_types)

    def test_cluster_auto_leaves_few_org_units_unclustered(self):
        tilejson = self.get_tilejson({"version_id": self.sw_version_1.id, "cluster": "auto"})
        self.assertIsNone(tilejson["cluster"])
        self.assertTrue(tilejson["tiles"][0].endswith(f"?version_id={self.sw_version_1.id}"))
        self.assertNotIn("point_count", tilejson["vector_layers"][0]["fields"])

    def test_cluster_auto_clusters_many_org_units(self):
        # 2 located org units: "many" past 1
        with mock.patch("iaso.api.v3.common.mvt.AUTO_CLUSTER_MIN_LOCATED", 1):
            tilejson = self.get_tilejson({"version_id": self.sw_version_1.id, "cluster": "auto"})
        self.assertEqual(tilejson["cluster"], AUTO_CLUSTER_PX)
        self.assertTrue(tilejson["tiles"][0].endswith(f"&cluster={AUTO_CLUSTER_PX}"))
        self.assertIn("point_count", tilejson["vector_layers"][0]["fields"])

    def test_cluster_is_what_was_asked_otherwise(self):
        self.assertEqual(self.get_tilejson({"cluster": "40"})["cluster"], 40)
        self.assertIsNone(self.get_tilejson()["cluster"])

    def test_cluster_by_is_passed_on_and_described(self):
        tilejson = self.get_tilejson({"fields": "name", "cluster": "40", "cluster_by": "org_unit_type_id"})
        self.assertTrue(tilejson["tiles"][0].endswith("&cluster=40&cluster_by=org_unit_type_id"))
        self.assertIn("org_unit_type_id", tilejson["vector_layers"][0]["fields"])

    def test_bounds_are_the_extent_of_the_matching_org_units(self):
        # the country square and the region point in it - not the other account's Wakanda
        self.assertEqual(self.get_tilejson()["bounds"], [0, 0, 10, 10])
        self.assertEqual(self.get_tilejson({"id": self.region.id})["bounds"], [5, 5, 5, 5])
        # none located: no bounds, TileJSON's default is the whole world
        self.assertNotIn("bounds", self.get_tilejson({"id": self.district.id}))

    def test_cache_key_is_passed_on_to_the_tiles(self):
        response = self.client.get(f"{BASE_URL}tilejson/", {"id": self.region.id, "cache_key": "k1"})
        self.assertEqual(response["Cache-Control"], f"private, max-age={TILE_CACHE_MAX_AGE}")
        self.assertTrue(response.json()["tiles"][0].endswith(f"?id={self.region.id}&cache_key=k1"))

    def test_validates_like_the_tiles(self):
        self.assertIn("suggestions", self.get_json({"not_a_param": "1"}, 400, url=f"{BASE_URL}tilejson/"))
        self.get_json({"fields": "groups"}, 400, url=f"{BASE_URL}tilejson/")
        self.get_json({"fields": "via_id"}, 400, url=f"{BASE_URL}tilejson/")

    def test_query_count(self):
        # the counts and extents are one query, the names of the counted types another, and `filter_for_user` a
        # third. The settings (`settings_cursor`) add one query in a request; here, within the test's transaction,
        # a savepoint that also puts them back.
        with self.assertNumQueries(8):
            self.get_tilejson({"version_id": self.sw_version_1.id})


def zigzag_square(teeth=100, amplitude=0.1):
    """The 1..9 square, its top edge a zigzag of `teeth` teeth `amplitude` degrees high: detail that only shows
    when zoomed in."""
    step = 8 / teeth
    top = [(9 - i * step, 9 + amplitude * (i % 2)) for i in range(teeth + 1)]
    return MultiPolygon(Polygon(((1, 1), (9, 1), *top, (1, 1))))


class OrgUnitV3TileSimplificationTestCase(TileRequestsMixin, OrgUnitV3TestCase):
    """Shapes are drawn as detailed as the zoom shows, no more."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.zigzag = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type, version=cls.sw_version_1, name="Zigzag", geom=zigzag_square()
        )

    def zigzag_geometry_size(self, tile):
        return self.get_features({"id": self.zigzag.id}, tile=tile)[self.zigzag.id]["geometry_size"]

    def test_low_zoom_tiles_simplify_what_a_pixel_hides(self):
        # z1: a pixel is 0.35 degrees, the teeth are gone (the tile grid alone is fine enough to keep them):
        # a 4 corners ring is 11 ints
        self.assertLess(self.zigzag_geometry_size(FIXTURE_TILE), 20)
        # z8: a pixel is 0.0014 degrees, the ~17 teeth in that tile stay (2 ints a vertex)
        self.assertGreater(self.zigzag_geometry_size(tile_for(8, 5, 9)), 40)

    def test_simplified_shape_is_only_drawn_while_it_is_accurate(self):
        # `simplified_geom` strays up to 0.1% of the 8 degrees extent, 0.008 degrees: half a pixel up to z5
        simplified = MultiPolygon(Polygon(((1, 1), (9, 1), (9, 9), (1, 9), (1, 1))))
        m.OrgUnit.objects.filter(pk=self.zigzag.pk).update(simplified_geom=simplified)

        def drawn_points(z):
            tile = Tile(*tile_for(z, 5, 5))
            points = Func(drawn_geometry(tile), function="ST_NPoints", output_field=IntegerField())
            return m.OrgUnit.objects.filter(pk=self.zigzag.pk).values_list(points, flat=True).get()

        self.assertEqual(drawn_points(5), 5)
        self.assertEqual(drawn_points(6), len(self.zigzag.geom.coords[0][0]))


class OrgUnitV3ClosestLocatedTestCase(OrgUnitV3TestCase):
    """`ancestor_id__closest_located`: opening an org unit on a map, even when its children have no geometry.

    Naboo (shape) > Theed (point) > Theed District (nothing), plus
    Naboo > Hidden Region (nothing) > Otoh Gunga (point) > Deep Village (point)"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.hidden_region = m.OrgUnit.objects.create(
            org_unit_type=cls.region_type, version=cls.sw_version_1, parent=cls.country, name="Hidden Region"
        )
        cls.otoh_gunga = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=cls.sw_version_1,
            parent=cls.hidden_region,
            name="Otoh Gunga",
            location=Point(x=3, y=3, z=0),
        )
        cls.deep_village = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=cls.sw_version_1,
            parent=cls.otoh_gunga,
            name="Deep Village",
            location=Point(x=3.5, y=3.5, z=0),
        )

    def test_list_returns_located_children_and_tunnels_through_the_others(self):
        # Theed: a located child. Otoh Gunga: the closest located org unit below Hidden Region. Not Deep Village:
        # Otoh Gunga, located, is in between.
        ids = self.get_ids({"ancestor_id__closest_located": self.country.id})
        self.assertCountEqual(ids, [self.region.id, self.otoh_gunga.id])

    def test_tiles_tell_which_child_a_tunneled_feature_stands_in_for(self):
        response = self.client.get(
            f"{BASE_URL}tiles/1/1/0/",
            {"ancestor_id__closest_located": self.country.id, "fields": "name,via_id,via_name"},
        )
        self.assertEqual(response.status_code, 200, response.content[:500])
        features = decode_tile(response.content)["org_units"]
        self.assertEqual(features[self.region.id]["properties"], {"name": "Theed"})
        self.assertEqual(
            features[self.otoh_gunga.id]["properties"],
            {"name": "Otoh Gunga", "via_id": self.hidden_region.id, "via_name": "Hidden Region"},
        )

    def test_org_unit_of_another_account_does_not_exist(self):
        error = self.get_error({"ancestor_id__closest_located": self.marvel_org_unit.id})
        self.assertEqual(error["error"], f"Org unit {self.marvel_org_unit.id} does not exist")

    def test_drill_down_list_fields(self):
        """What a map lists next to itself: the children it can't draw, and how to zoom to them."""
        rows = self.get_results(
            {
                "parent_id": self.country.id,
                "fields": "id,name,has_geometry,has_children,located_descendants,located_bbox",
                "order": "name",
            }
        )
        self.assertEqual(
            rows,
            [
                {
                    "id": self.hidden_region.id,
                    "name": "Hidden Region",
                    "has_geometry": False,
                    "has_children": True,
                    "located_descendants": 2,
                    "located_bbox": [3.0, 3.0, 3.5, 3.5],
                },
                {
                    "id": self.region.id,
                    "name": "Theed",
                    "has_geometry": True,
                    "has_children": True,
                    "located_descendants": 0,
                    "located_bbox": [5.0, 5.0, 5.0, 5.0],
                },
            ],
        )
        (district,) = self.get_results(
            {"id": self.district.id, "fields": "has_geometry,has_children,located_descendants,located_bbox"}
        )
        self.assertEqual(
            district,
            {"has_geometry": False, "has_children": False, "located_descendants": 0, "located_bbox": None},
        )


class OrgUnitV3TileClusterTestCase(TileRequestsMixin, OrgUnitV3TestCase):
    """`cluster=<px>`: points grouped by squares of that many pixels, so a dense search stays a light tile."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # 5 villages within 0.01 degree of (2, 2): a few meters apart at z1, a few hundred at z13
        cls.villages = [
            m.OrgUnit.objects.create(
                org_unit_type=cls.district_type,
                version=cls.sw_version_1,
                name=f"Village {i}",
                location=Point(x=2 + i * 0.002, y=2, z=0),
            )
            for i in range(5)
        ]
        cls.query = {"org_unit_type_id__in": f"{cls.district_type.id},{cls.region_type.id}"}

    def get_clustered(self, cluster="40", tile=FIXTURE_TILE, **params):
        return self.get_features({**self.query, "cluster": cluster, **params}, tile=tile)

    def test_groups_close_points_into_one_feature_with_their_count(self):
        # z5: 40 pixels are 0.9 degree, the villages are in one square, the region 3 degrees away
        features = self.get_clustered(tile=tile_for(5, 2, 2))
        # the region at (5, 5) is alone in its square: it stays itself, with its id and properties
        self.assertEqual(features[self.region.id]["properties"]["name"], "Theed")
        self.assertNotIn("point_count", features[self.region.id]["properties"])
        # the villages are one cluster: no id (it isn't an org unit), no properties but the count
        self.assertEqual(features[None], {"properties": {"point_count": 5}, "type": "Point", "geometry_size": 3})
        self.assertEqual(len(features), 2)

    def test_points_far_enough_apart_stay_apart(self):
        # z13: a pixel is 20 meters, the villages are 200 meters apart
        tile = tile_for(13, 2.004, 2)
        features = self.get_clustered(cluster="2", tile=tile)
        self.assertEqual(set(features), {village.id for village in self.villages})

    def test_no_clusters_from_the_cluster_max_zoom(self):
        # points that close are the same place: the client lists them rather than zooming in for ever
        tile = tile_for(CLUSTER_MAX_ZOOM, 2.004, 2)
        features = self.get_clustered(cluster=str(128), tile=tile)
        self.assertEqual(set(features), {village.id for village in self.villages})

    def test_a_point_counts_in_one_tile_only(self):
        # a point on the edge of two tiles overlaps both, but is only clustered in one
        edge = m.OrgUnit.objects.create(
            org_unit_type=self.district_type, version=self.sw_version_1, name="Edge", location=Point(0, 1, 0)
        )
        west, east = tile_for(1, -1, 1), tile_for(1, 1, 1)
        self.assertIn(edge.id, self.get_features({"id": edge.id}, tile=west))
        self.assertNotIn(edge.id, self.get_clustered(tile=west, id=edge.id))
        self.assertIn(edge.id, self.get_clustered(tile=east, id=edge.id))

    def test_shapes_are_not_clustered_but_tiny_ones_become_points(self):
        tiny = m.OrgUnit.objects.create(
            org_unit_type=self.district_type,
            version=self.sw_version_1,
            name="Health post",
            geom=MultiPolygon(Polygon(((3, 3), (3, 3.001), (3.001, 3.001), (3.001, 3), (3, 3)))),
        )
        params = {"org_unit_type_id__in": f"{self.country_type.id},{self.district_type.id}"}
        # without clustering, a 0.3 pixel square vanishes once snapped to the tile grid
        self.assertNotIn(tiny.id, self.get_features({"id": tiny.id}))
        features = self.get_features({**params, "id__in": f"{tiny.id},{self.country.id}", "cluster": "2"})
        self.assertEqual(features[tiny.id]["type"], "Point")
        self.assertEqual(features[self.country.id]["type"], "Polygon")

    def test_clusters_locations_and_collapsed_shapes_together(self):
        # locations are 3D points, collapsed shapes 2D ones: one cluster all the same
        m.OrgUnit.objects.create(
            org_unit_type=self.district_type,
            version=self.sw_version_1,
            name="Health post",
            geom=MultiPolygon(Polygon(((2, 2), (2, 2.001), (2.001, 2.001), (2.001, 2), (2, 2)))),
        )
        features = self.get_clustered(tile=tile_for(5, 2, 2))
        self.assertEqual(features[None]["properties"], {"point_count": 6})

    def test_empty_locations_are_left_out(self):
        m.OrgUnit.objects.create(
            org_unit_type=self.district_type, version=self.sw_version_1, name="Nowhere", location="POINT Z EMPTY"
        )
        features = self.get_clustered(tile=tile_for(5, 2, 2))
        self.assertEqual(features[None]["properties"], {"point_count": 5})

    def test_cluster_by_type_makes_one_cluster_per_type(self):
        for i in range(3):
            m.OrgUnit.objects.create(
                org_unit_type=self.region_type,
                version=self.sw_version_1,
                name=f"Health post {i}",
                location=Point(x=2.001 + i * 0.002, y=2.001, z=0),
            )
        tile = tile_for(5, 2, 2)

        def clusters(**params):
            content = self.get_tile({**self.query, "cluster": "40", "fields": "name", **params}, tile=tile).content
            return sorted(
                (
                    feature["properties"]
                    for feature in decode_tile(content, as_list=True)["org_units"]
                    if feature["id"] is None
                ),
                key=lambda properties: properties["point_count"],
            )

        self.assertEqual(clusters(), [{"point_count": 8}])
        # each keeps its type - asked or not in `fields`
        self.assertEqual(
            clusters(cluster_by="org_unit_type_id"),
            [
                {"point_count": 3, "org_unit_type_id": self.region_type.id},
                {"point_count": 5, "org_unit_type_id": self.district_type.id},
            ],
        )

    def test_rejects_invalid_cluster_by(self):
        self.get_tile_error({"cluster": "40", "cluster_by": "name"})

    def test_tiles_take_no_auto_cluster(self):
        # the TileJSON picks for its tiles: their url holds what it picked
        self.get_tile_error({"cluster": "auto"})

    def test_rejects_invalid_cluster_sizes(self):
        for value in ("0", "129", "big"):
            with self.subTest(value=value):
                self.get_tile_error({"cluster": value})


class OrgUnitV3TileCapTestCase(TileRequestsMixin, OrgUnitV3TestCase):
    """A tile is cut at `MAX_TILE_FEATURES` features, and says so."""

    def test_cut_tile_says_how_many_features_it_should_have_held(self):
        with mock.patch("iaso.api.v3.common.mvt.MAX_TILE_FEATURES", 1):
            layers = decode_tile(self.get_tile().content)
        self.assertEqual(len(layers["org_units"]), 1)
        (meta,) = layers["tile_meta"].values()
        self.assertEqual(meta["properties"], {"feature_count": 2, "kept": 1})

    def test_whole_tile_has_no_meta_layer(self):
        self.assertNotIn("tile_meta", decode_tile(self.get_tile().content))


class OrgUnitV3TileQuerySettingsTestCase(TileRequestsMixin, OrgUnitV3TestCase):
    """The tile and TileJSON queries run without JIT, and change no setting of the queries after them."""

    def settings(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('jit'), current_setting('statement_timeout')")
            return cursor.fetchone()

    def settings_during(self, marker, request):
        """`(jit, statement_timeout)` as the query whose sql holds `marker` runs, for `request`."""
        seen = []

        def spy(execute, sql, params, many, context):
            if marker in sql:
                context["cursor"].execute("SELECT current_setting('jit'), current_setting('statement_timeout')")
                seen.append(context["cursor"].fetchone())
            return execute(sql, params, many, context)

        with connection.execute_wrapper(spy):
            request()
        (settings,) = seen
        return settings

    def test_tile_query_runs_without_jit_and_with_a_timeout(self):
        self.assertEqual(self.settings_during("ST_AsMVT", self.get_tile), ("off", "15s"))

    def test_tilejson_query_runs_without_jit(self):
        jit, _ = self.settings_during("percentile_cont", lambda: self.client.get(f"{BASE_URL}tilejson/"))
        self.assertEqual(jit, "off")

    def test_settings_are_put_back_within_a_callers_transaction(self):
        # the test runs in a transaction, where `SET LOCAL` in a savepoint would last until it ends
        before = self.settings()
        self.get_tile({"cluster": "40"})
        self.client.get(f"{BASE_URL}tilejson/")
        self.assertEqual(self.settings(), before)
