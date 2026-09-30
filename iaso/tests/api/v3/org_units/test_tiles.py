import math
import struct

from django.contrib.gis.geos import Point

from iaso import models as m
from iaso.api.v3.common.mvt import INDEX_PREFILTER_MIN_ZOOM, MVT_MEDIA_TYPE

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


def decode_tile(content: bytes) -> dict:
    """{layer name: {feature id: {"properties": {...}, "type": "Point"|...}}}"""
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
        features = {}
        for raw in raw_features:
            feature_id, properties, geometry_type = None, {}, None
            for feature_field, value in _messages(raw):
                if feature_field == 1:
                    feature_id = value
                elif feature_field == 2:
                    tags = _packed(value)
                    properties = {keys[k]: values[v] for k, v in zip(tags[::2], tags[1::2])}
                elif feature_field == 3:
                    geometry_type = GEOMETRY_TYPES.get(value)
            features[feature_id] = {"properties": properties, "type": geometry_type}
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


class OrgUnitV3TilesTestCase(OrgUnitV3TestCase):
    """`GET /api/v3/orgunits/tiles/{z}/{x}/{y}/`"""

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
        self.assertEqual(self.get_tile()["Cache-Control"], "private, no-cache")

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
        # resolution itself. The profile and account are already loaded on the test user.
        with self.assertNumQueries(4):
            self.get_tile({"fields": "name,has_children,bbox,via_id", "ancestor_id__closest_located": self.country.id})


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
