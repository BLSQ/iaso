from types import SimpleNamespace
from unittest import TestCase

from django.contrib.gis.geos import Point, Polygon

from iaso.diffing.comparisons import _COORD_RE, GeometryFieldType, _round_coord


class RoundCoordTests(TestCase):
    def round_coord(self, wkt_fragment):
        return _COORD_RE.sub(_round_coord, wkt_fragment)

    def test_rounds_to_six_decimals(self):
        self.assertEqual(self.round_coord("1.1234567 2.7654321"), "1.123457 2.765432")

    def test_absorbs_floating_point_drift(self):
        self.assertEqual(
            self.round_coord("1.1234561 2.7654321"),
            self.round_coord("1.12345609999 2.76543209999"),
        )

    def test_leaves_shorter_decimals_unchanged_in_value(self):
        self.assertEqual(self.round_coord("1.1 2.2"), "1.1 2.2")

    def test_handles_negative_coordinates(self):
        self.assertEqual(self.round_coord("-1.1234567 -2.7654321"), "-1.123457 -2.765432")

    def test_handles_integer_coordinates(self):
        self.assertEqual(self.round_coord("1 2"), "1.0 2.0")

    def test_applies_to_every_coordinate_pair_in_a_wkt_string(self):
        wkt = "POLYGON ((1.1234567 2.7654321, 3.1234567 4.7654321, 1.1234567 2.7654321))"
        self.assertEqual(
            self.round_coord(wkt),
            "POLYGON ((1.123457 2.765432, 3.123457 4.765432, 1.123457 2.765432))",
        )

    def test_applies_to_every_coordinate_pair_in_a_multipolygon_wkt_string(self):
        wkt = (
            "MULTIPOLYGON (((1.1234567 2.7654321, 3.1234567 4.7654321, 1.1234567 2.7654321)), "
            "((5.1234567 6.7654321, 7.1234567 8.7654321, 5.1234567 6.7654321)))"
        )
        self.assertEqual(
            self.round_coord(wkt),
            "MULTIPOLYGON (((1.123457 2.765432, 3.123457 4.765432, 1.123457 2.765432)), "
            "((5.123457 6.765432, 7.123457 8.765432, 5.123457 6.765432)))",
        )

    def test_applies_to_a_multipolygon_wkt_string_without_decimals(self):
        wkt = "MULTIPOLYGON (((1 2, 3 4, 1 2)), ((5 6, 7 8, 5 6)))"
        self.assertEqual(
            self.round_coord(wkt),
            "MULTIPOLYGON (((1.0 2.0, 3.0 4.0, 1.0 2.0)), ((5.0 6.0, 7.0 8.0, 5.0 6.0)))",
        )

    def test_applies_to_a_multipolygon_wkt_string_with_two_decimals(self):
        wkt = "MULTIPOLYGON (((1.12 2.76, 3.12 4.76, 1.12 2.76)), ((5.12 6.76, 7.12 8.76, 5.12 6.76)))"
        self.assertEqual(
            self.round_coord(wkt),
            "MULTIPOLYGON (((1.12 2.76, 3.12 4.76, 1.12 2.76)), ((5.12 6.76, 7.12 8.76, 5.12 6.76)))",
        )


class GeometryFieldTypeTests(TestCase):
    def setUp(self):
        self.field_type = GeometryFieldType("geometry")

    def test_access_returns_none_when_org_unit_is_none(self):
        self.assertIsNone(self.field_type.access(None))

    def test_access_returns_none_when_no_geometry_is_set(self):
        org_unit = SimpleNamespace(location=None, geom=None, simplified_geom=None)
        self.assertIsNone(self.field_type.access(org_unit))

    def test_access_prefers_location_over_geom_and_simplified_geom(self):
        location = Point(1, 2)
        org_unit = SimpleNamespace(location=location, geom=Point(3, 4), simplified_geom=Point(5, 6))
        self.assertEqual(self.field_type.access(org_unit), location)

    def test_access_falls_back_to_geom_when_no_location(self):
        geom = Point(3, 4)
        org_unit = SimpleNamespace(location=None, geom=geom, simplified_geom=Point(5, 6))
        self.assertEqual(self.field_type.access(org_unit), geom)

    def test_access_falls_back_to_simplified_geom_when_no_location_or_geom(self):
        simplified_geom = Point(5, 6)
        org_unit = SimpleNamespace(location=None, geom=None, simplified_geom=simplified_geom)
        self.assertEqual(self.field_type.access(org_unit), simplified_geom)

    def test_is_same_when_both_are_none(self):
        self.assertTrue(self.field_type.is_same(None, None))

    def test_is_same_when_only_one_is_none(self):
        point = Point(1, 2)
        self.assertFalse(self.field_type.is_same(point, None))
        self.assertFalse(self.field_type.is_same(None, point))

    def test_is_same_when_geom_types_differ(self):
        point = Point(1, 2)
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        self.assertFalse(self.field_type.is_same(point, polygon))

    def test_is_same_points_within_rounding_tolerance(self):
        point = Point(1.1234561, 2.7654321)
        other_point = Point(1.12345609999, 2.76543209999)
        self.assertTrue(self.field_type.is_same(point, other_point))

    def test_is_same_points_beyond_rounding_tolerance(self):
        point = Point(1.0, 2.0)
        other_point = Point(1.01, 2.0)
        self.assertFalse(self.field_type.is_same(point, other_point))

    def test_is_same_polygons_ignoring_ring_orientation(self):
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        reversed_polygon = Polygon(tuple(reversed(polygon[0])))
        self.assertTrue(self.field_type.is_same(polygon, reversed_polygon))

    def test_is_same_polygons_within_rounding_tolerance(self):
        polygon = Polygon(((0, 0), (0, 1.1234561), (1, 1), (1, 0), (0, 0)))
        other_polygon = Polygon(((0, 0), (0, 1.12345609999), (1, 1), (1, 0), (0, 0)))
        self.assertTrue(self.field_type.is_same(polygon, other_polygon))

    def test_is_same_polygons_with_different_coordinates(self):
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        other_polygon = Polygon(((0, 0), (0, 2), (2, 2), (2, 0), (0, 0)))
        self.assertFalse(self.field_type.is_same(polygon, other_polygon))

    def test_is_same_does_not_mutate_the_original_geometries(self):
        # This ring is chosen so that BOTH it and its reverse are non-canonical
        # (verified separately: calling normalize() on either one changes its wkt).
        # A ring like ((0,0),(0,1),(1,1),(1,0),(0,0)) would make this test pass
        # trivially, since its reverse is already the canonical form and wouldn't
        # change even without the clone-before-normalize protection.
        ring = ((1, 1), (2, 0), (0, 0), (1, 1))
        polygon = Polygon(ring)
        reversed_polygon = Polygon(tuple(reversed(ring)))
        original_polygon_wkt = polygon.wkt
        original_reversed_wkt = reversed_polygon.wkt
        self.field_type.is_same(polygon, reversed_polygon)
        self.assertEqual(polygon.wkt, original_polygon_wkt)
        self.assertEqual(reversed_polygon.wkt, original_reversed_wkt)

    def test_distance_returns_none_when_either_value_is_none(self):
        point = Point(1, 2)
        self.assertIsNone(self.field_type.distance(None, point))
        self.assertIsNone(self.field_type.distance(point, None))
        self.assertIsNone(self.field_type.distance(None, None))

    def test_distance_between_points_in_kilometers(self):
        point = Point(0, 0)
        other_point = Point(1, 0)
        self.assertAlmostEqual(self.field_type.distance(point, other_point), 111, delta=1)

    def test_distance_is_zero_for_identical_points(self):
        point = Point(1, 2)
        self.assertEqual(self.field_type.distance(point, point), 0)


class PolygonNormalizeBehaviorTests(TestCase):
    """
    Pins the underlying GEOS/GeoDjango behaviour that the clone-before-normalize
    comment in GeometryFieldType.is_same relies on. If a future GeoDjango version
    made normalize() return a new geometry instead of mutating in place, is_same's
    clone() calls would become unnecessary but harmless; if it started raising or
    behaving differently, this test would catch that before is_same's own tests do.
    """

    def test_normalize_mutates_in_place_and_returns_none(self):
        polygon = Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)))
        original_wkt = polygon.wkt

        return_value = polygon.normalize()

        self.assertIsNone(return_value)
        self.assertNotEqual(polygon.wkt, original_wkt)
