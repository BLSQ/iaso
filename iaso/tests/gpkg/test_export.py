from django.contrib.gis.geos import MultiPolygon, Point, Polygon

from iaso import models as m
from iaso.gpkg import org_units_to_gpkg_bytes
from iaso.test import TestCase


class ExportTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.jedi_team = m.OrgUnitType.objects.create(name="Jedi Team", short_name="Jdt")
        cls.jedi_squad.sub_unit_types.add(cls.jedi_team)

        cls.mock_point = Point(x=4, y=50, z=100)
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.jedi_squad_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Brussels Jedi Squad",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            validated=True,
        )

        cls.jedi_team_saint_gilles = m.OrgUnit.objects.create(
            parent=cls.jedi_squad_brussels,
            org_unit_type=cls.jedi_team,
            version=sw_version_2,
            name="Saint-Gilles Jedi Team",
            location=cls.mock_point,
            validated=True,
        )

    def test_org_units_to_gpkg(self):
        gpkg_content = org_units_to_gpkg_bytes(m.OrgUnit.objects.all())
        self.assertIsInstance(gpkg_content, bytes)
        self.assertGreater(len(gpkg_content), 200)
