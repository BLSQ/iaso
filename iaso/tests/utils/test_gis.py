from django.contrib.gis.geos import GEOSGeometry
from django.test import TestCase

from iaso.utils.gis import simplify_geom


class SimplifyGeomTestCase(TestCase):
    def test_simplify_geom_cameroon(self):
        with open("iaso/tests/fixtures/geometry/cameroon_multipolygon.txt") as multipolygon_file:
            geom = GEOSGeometry(multipolygon_file.read(), srid=4326)
        simplified_geom = simplify_geom(geom)
        self.assertEqual(geom.num_coords, 38547)
        self.assertEqual(simplified_geom.num_coords, 678)

    def test_simplify_as_essomba_geometry(self):
        with open("iaso/tests/fixtures/geometry/as_essomba_multipolygon.txt") as multipolygon_file:
            geom = GEOSGeometry(multipolygon_file.read(), srid=4326)
        simplified_geom = simplify_geom(geom)
        self.assertEqual(geom.num_coords, 91)
        self.assertTrue(simplified_geom.num_coords >= 90)  # nearly number of coords.
        self.assertTrue(simplified_geom.num_coords <= 91)  # nearly number of coords.
