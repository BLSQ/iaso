from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from iaso import models as m
from iaso.api.v3.common.spatial_filters import (
    OutsideBboxFilter,
    OutsideOrgUnitFilter,
    WithinOrgUnitFilter,
    WithinOrIntersectsBboxFilter,
    parse_bbox,
    resolve_reference_geometry,
)
from iaso.test import TestCase


def _square(minx, miny, maxx, maxy):
    return MultiPolygon(Polygon.from_bbox((minx, miny, maxx, maxy)))


class ParseBboxTestCase(SimpleTestCase):
    def assert_bad_request(self, value, detail):
        with self.assertRaises(ValidationError) as ctx:
            parse_bbox(value)
        self.assertEqual(ctx.exception.detail["error"], f"Invalid bbox value {value!r}")
        self.assertEqual(ctx.exception.detail["detail"], detail)

    def test_valid_bbox(self):
        (polygon,) = parse_bbox("-1.5,2,10,20.25")
        self.assertEqual(polygon.srid, 4326)
        self.assertEqual(polygon.extent, (-1.5, 2.0, 10.0, 20.25))

    def test_whitespace_around_values_is_accepted(self):
        (polygon,) = parse_bbox(" 0, 0 ,1 ,1 ")
        self.assertEqual(polygon.extent, (0.0, 0.0, 1.0, 1.0))

    def test_wrong_number_of_values(self):
        for value in ("0,0,1", "0,0,1,1,2", ""):
            with self.subTest(value=value):
                self.assert_bad_request(value, "Expected 'minx,miny,maxx,maxy'")

    def test_non_numeric_value(self):
        for value in ("0,0,1,x", "not,a,bbox,!", "0,0,,1"):
            with self.subTest(value=value):
                self.assert_bad_request(value, "All 4 values must be numbers")

    def test_out_of_range_or_reversed_latitudes(self):
        self.assert_bad_request("-181,0,1,1", "Longitudes (minx, maxx) must be between -180 and 180")
        self.assert_bad_request("0,0,180.5,1", "Longitudes (minx, maxx) must be between -180 and 180")
        self.assert_bad_request("0,-91,1,1", "Latitudes (miny, maxy) must be between -90 and 90")
        self.assert_bad_request(
            "0,10,1,0", "miny must be <= maxy (minx > maxx is allowed: the box then crosses the antimeridian)"
        )

    def test_whole_world_is_one_box(self):
        (box,) = parse_bbox("-180,-90,180,90")
        self.assertEqual(box.extent, (-180.0, -90.0, 180.0, 90.0))

    def test_box_crossing_the_antimeridian_is_split_in_two(self):
        west_piece, east_piece = parse_bbox("177,-20,-178,-15")
        self.assertEqual(west_piece.extent, (177.0, -20.0, 180.0, -15.0))
        self.assertEqual(east_piece.extent, (-180.0, -20.0, -178.0, -15.0))

    def test_degenerate_box_is_kept(self):
        (piece,) = parse_bbox("5,5,5,5")
        self.assertEqual(piece.extent, (5.0, 5.0, 5.0, 5.0))

    def test_non_finite_value(self):
        # `float()` accepts these - "nan" used to reach GEOS and raise an uncaught `GEOSException` (500)
        for value in ("nan,0,1,1", "0,inf,1,1", "0,0,-inf,1", "1e400,0,1,1"):
            with self.subTest(value=value):
                self.assert_bad_request(value, "All 4 values must be finite numbers")


class SpatialFiltersTestCase(TestCase):
    """Filters applied straight to a queryset (no view, so no requesting user and no account scoping -
    scoping through the API is covered in `test_org_units.py`)."""

    @classmethod
    def setUpTestData(cls):
        cls.shape = m.OrgUnit.objects.create(name="Shape", geom=_square(0, 0, 10, 10))
        cls.simplified_only = m.OrgUnit.objects.create(name="Simplified only", simplified_geom=_square(0, 0, 3, 3))
        cls.both = m.OrgUnit.objects.create(
            name="Both", geom=_square(100, 100, 110, 110), simplified_geom=_square(0, 0, 3, 3)
        )
        cls.small_inside = m.OrgUnit.objects.create(name="Small inside", geom=_square(1, 1, 2, 2))
        cls.crossing = m.OrgUnit.objects.create(name="Crossing", geom=_square(8, 8, 12, 12))
        cls.point_inside = m.OrgUnit.objects.create(name="Point inside", location=Point(5, 5, 0))
        cls.point_in_corner = m.OrgUnit.objects.create(name="Point in corner", location=Point(1, 1, 0))
        cls.point_outside = m.OrgUnit.objects.create(name="Point outside", location=Point(50, 50, 0))
        cls.no_geometry = m.OrgUnit.objects.create(name="No geometry")

    def ids(self, queryset):
        return set(queryset.values_list("id", flat=True))

    def apply(self, filter_, value):
        filter_.parent = None  # normally the FilterSet it's bound to - none here, so no requesting user
        return filter_.filter(m.OrgUnit.objects.all(), value)

    # -- bbox --

    def test_bbox_keeps_geometries_intersecting_the_box(self):
        queryset = self.apply(WithinOrIntersectsBboxFilter(geometry_field="geom"), "9,9,11,11")
        self.assertEqual(self.ids(queryset), {self.shape.id, self.crossing.id})

    def test_bbox_on_location(self):
        queryset = self.apply(WithinOrIntersectsBboxFilter(geometry_field="location"), "0,0,10,10")
        self.assertEqual(self.ids(queryset), {self.point_inside.id, self.point_in_corner.id})

    def test_outside_bbox_excludes_rows_without_that_geometry(self):
        queryset = self.apply(OutsideBboxFilter(geometry_field="location"), "0,0,10,10")
        self.assertEqual(self.ids(queryset), {self.point_outside.id})

    def test_outside_bbox_on_geom(self):
        queryset = self.apply(OutsideBboxFilter(geometry_field="geom"), "0,0,10,10")
        self.assertEqual(self.ids(queryset), {self.both.id})

    def test_invalid_bbox_is_bad_request(self):
        for filter_class in (WithinOrIntersectsBboxFilter, OutsideBboxFilter):
            with self.subTest(filter=filter_class.__name__), self.assertRaises(ValidationError):
                self.apply(filter_class(geometry_field="geom"), "0,0,1")

    # -- within / outside org unit --

    def test_within_org_unit_includes_the_reference_itself(self):
        queryset = self.apply(WithinOrgUnitFilter(geometry_field="geom"), self.shape.id)
        self.assertEqual(self.ids(queryset), {self.shape.id, self.small_inside.id})

    def test_within_org_unit_on_location(self):
        queryset = self.apply(WithinOrgUnitFilter(geometry_field="location"), self.shape.id)
        self.assertEqual(self.ids(queryset), {self.point_inside.id, self.point_in_corner.id})

    def test_outside_org_unit_excludes_rows_without_that_geometry(self):
        queryset = self.apply(OutsideOrgUnitFilter(geometry_field="location"), self.shape.id)
        self.assertEqual(self.ids(queryset), {self.point_outside.id})

    def test_outside_org_unit_on_geom(self):
        queryset = self.apply(OutsideOrgUnitFilter(geometry_field="geom"), self.shape.id)
        self.assertEqual(self.ids(queryset), {self.crossing.id, self.both.id})

    def test_reference_uses_simplified_geom_first(self):
        # `both` has a far-away `geom` but a small `simplified_geom` near the origin - the latter is used
        queryset = self.apply(WithinOrgUnitFilter(geometry_field="location"), self.both.id)
        self.assertEqual(self.ids(queryset), {self.point_in_corner.id})

    def test_empty_value_leaves_the_queryset_untouched(self):
        queryset = m.OrgUnit.objects.all()
        filters = (
            WithinOrIntersectsBboxFilter(geometry_field="geom"),
            OutsideBboxFilter(geometry_field="geom"),
            WithinOrgUnitFilter(geometry_field="geom"),
            OutsideOrgUnitFilter(geometry_field="geom"),
        )
        for filter_ in filters:
            for value in (None, ""):
                with self.subTest(filter=type(filter_).__name__, value=value):
                    self.assertIs(filter_.filter(queryset, value), queryset)


class ResolveReferenceGeometryTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        project = m.Project.objects.create(name="Project", app_id="app", account=cls.account)
        source = m.DataSource.objects.create(name="Source")
        source.projects.add(project)
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        other_account = m.Account.objects.create(name="Other account")
        other_project = m.Project.objects.create(name="Other project", app_id="other.app", account=other_account)
        other_source = m.DataSource.objects.create(name="Other source")
        other_source.projects.add(other_project)
        other_version = m.SourceVersion.objects.create(data_source=other_source, number=1)

        cls.geom_only = m.OrgUnit.objects.create(name="Geom only", version=version, geom=_square(0, 0, 10, 10))
        cls.both = m.OrgUnit.objects.create(
            name="Both", version=version, geom=_square(0, 0, 10, 10), simplified_geom=_square(0, 0, 5, 5)
        )
        cls.no_geometry = m.OrgUnit.objects.create(name="No geometry", version=version)
        cls.other_account_unit = m.OrgUnit.objects.create(
            name="Other account", version=other_version, geom=_square(0, 0, 1, 1)
        )

    def resolve(self, org_unit_id, user=None):
        return resolve_reference_geometry(org_unit_id, "location__within_org_unit", user=user)

    def assert_bad_request(self, org_unit_id, error, user=None):
        with self.assertRaises(ValidationError) as ctx:
            self.resolve(org_unit_id, user=user)
        self.assertEqual(ctx.exception.detail["error"], error)
        return ctx.exception.detail

    def test_falls_back_to_geom(self):
        self.assertEqual(self.resolve(self.geom_only.id).extent, (0.0, 0.0, 10.0, 10.0))

    def test_prefers_simplified_geom(self):
        self.assertEqual(self.resolve(self.both.id).extent, (0.0, 0.0, 5.0, 5.0))

    def test_org_unit_without_geometry(self):
        detail = self.assert_bad_request(self.no_geometry.id, f"Org unit {self.no_geometry.id} has no geometry")
        self.assertIn("'location__within_org_unit'", detail["detail"])

    def test_nonexistent_or_malformed_id(self):
        for org_unit_id in ("999999999", "abc"):
            with self.subTest(org_unit_id=org_unit_id):
                self.assert_bad_request(org_unit_id, f"Org unit {org_unit_id} does not exist")

    def test_scoped_to_the_users_account(self):
        self.assertIsNotNone(self.resolve(self.geom_only.id, user=self.user))
        self.assert_bad_request(
            self.other_account_unit.id, f"Org unit {self.other_account_unit.id} does not exist", user=self.user
        )

    def test_unscoped_without_a_user(self):
        self.assertEqual(self.resolve(self.other_account_unit.id).extent, (0.0, 0.0, 1.0, 1.0))


class GlobeBboxTestCase(TestCase):
    """Boxes on the `geography` columns, whose polygon edges are great circles: tested in planar lon/lat by
    `filter_bbox`, a box means exactly what its 4 numbers say - wide, whole-world, polar or crossing the
    antimeridian."""

    @classmethod
    def setUpTestData(cls):
        def point(name, x, y):
            return m.OrgUnit.objects.create(name=name, location=Point(x, y, 0))

        cls.greenwich = point("Greenwich", 0, 0)
        cls.east = point("East", 100, 0)
        cls.fiji_east = point("Fiji east", 179, -17)
        cls.fiji_west = point("Fiji west", -179.5, -16)
        cls.north_59 = point("59N", 45, 59)
        cls.north_65 = point("65N", 45, 65)
        cls.far_north = point("Far north", 120, 85)
        cls.far_south = point("Far south", -60, -85)
        cls.everything = [
            cls.greenwich,
            cls.east,
            cls.fiji_east,
            cls.fiji_west,
            cls.north_59,
            cls.north_65,
            cls.far_north,
            cls.far_south,
        ]
        m.OrgUnit.objects.create(name="No location")

    def ids(self, filter_class, value):
        filter_ = filter_class(geometry_field="location")
        filter_.parent = None
        return set(filter_.filter(m.OrgUnit.objects.all(), value).values_list("id", flat=True))

    def assert_within(self, value, expected):
        self.assertEqual(self.ids(WithinOrIntersectsBboxFilter, value), {org_unit.id for org_unit in expected})
        # `outside_bbox` is the exact complement, among org units that have a location
        outside = {org_unit.id for org_unit in self.everything} - {org_unit.id for org_unit in expected}
        self.assertEqual(self.ids(OutsideBboxFilter, value), outside)

    def test_whole_world(self):
        # used to be a 500: "Antipodal (180 degrees long) edge detected!"
        self.assert_within("-180,-90,180,90", self.everything)

    def test_box_wider_than_180_degrees(self):
        # used to be taken "the short way round" - i.e. the 20 degrees around the antimeridian, not these 340
        self.assert_within("-170,-80,170,80", [self.greenwich, self.east, self.north_59, self.north_65])

    def test_box_exactly_180_degrees_wide(self):
        self.assert_within("-180,-90,0,90", [self.greenwich, self.fiji_west, self.far_south])

    def test_box_crossing_the_antimeridian(self):
        self.assert_within("177,-20,-178,-15", [self.fiji_east, self.fiji_west])

    def test_polar_caps(self):
        self.assert_within("-180,80,180,90", [self.far_north])
        self.assert_within("-180,-90,180,-80", [self.far_south])

    def test_edges_follow_their_latitude_not_a_great_circle(self):
        # a great circle from (0, 60) to (90, 60) peaks near 67.8N - 65N must still be outside the box
        self.assert_within("0,0,90,60", [self.greenwich, self.north_59])
