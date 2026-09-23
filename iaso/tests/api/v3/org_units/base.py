from django.contrib.gis.geos import MultiPolygon, Point, Polygon

from iaso import models as m
from iaso.test import APITestCase


BASE_URL = "/api/v3/orgunits/"


class OrgUnitV3TestCase(APITestCase):
    """Shared fixture for `/api/v3/orgunits/`: a small Star Wars pyramid (country > region > district, plus two
    other countries) the requesting user can see, and a Marvel account whose org units they must never see.

    Geometry is kept trivial on purpose: `country` is the 0..10 square, `region`'s location the point (5, 5)."""

    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.sw_source = sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt", category="COUNTRY")
        cls.region_type = m.OrgUnitType.objects.create(name="Region", short_name="Rgn")
        cls.district_type = m.OrgUnitType.objects.create(name="District", short_name="Dst")
        for org_unit_type in (cls.country_type, cls.region_type, cls.district_type):
            org_unit_type.projects.add(project)

        cls.elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)

        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Naboo",
            geom=MultiPolygon(Polygon(((0, 0), (0, 10), (10, 10), (10, 0), (0, 0)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="country-ref",
            code="C1",
        )
        cls.country_without_geom = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Tatooine",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C2",
        )
        cls.region = m.OrgUnit.objects.create(
            org_unit_type=cls.region_type,
            version=sw_version_1,
            parent=cls.country,
            name="Theed",
            location=Point(x=5, y=5, z=0),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="region-ref",
            code="R1",
        )
        cls.region.groups.set([cls.elite_group])
        cls.district = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=sw_version_1,
            parent=cls.region,
            name="Theed District",
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        # accented name, to pin down that text filters are case- but not accent-insensitive
        cls.cote = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Côte d'Ivoire",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C3",
            aliases=["CIV"],
        )
        cls.star_wars_org_units = [cls.country, cls.country_without_geom, cls.region, cls.district, cls.cote]

        cls.user = cls.create_user_with_profile(
            username="padme", account=star_wars, first_name="Padme", last_name="Amidala", email="padme@naboo.example"
        )
        cls.region.creator = cls.user
        cls.region.save()

        # another account: its org units must never show up, nor leak through a filter referencing them
        cls.marvel = marvel = m.Account.objects.create(name="MCU")
        cls.other_account_user = cls.create_user_with_profile(username="tchalla", account=marvel)
        marvel_project = m.Project.objects.create(name="Wakanda outreach", app_id="marvel.app", account=marvel)
        marvel_source = m.DataSource.objects.create(name="Wakandan registry")
        marvel_source.projects.add(marvel_project)
        marvel_version = m.SourceVersion.objects.create(data_source=marvel_source, number=1)
        cls.marvel_org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=marvel_version,
            name="Wakanda",
            geom=MultiPolygon(Polygon(((20, 20), (20, 30), (30, 30), (30, 20), (20, 20)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.marvel_org_unit_without_geom = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=marvel_version,
            name="Sokovia",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def create_misplaced_facility(self, parent):
        """A child of `parent` whose point (50, 50) is far outside the `country` square."""
        return m.OrgUnit.objects.create(
            org_unit_type=self.district_type,
            version=self.sw_version_1,
            parent=parent,
            name="Misplaced Facility",
            location=Point(x=50, y=50, z=0),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

    # -- request helpers --

    def get_json(self, params=None, status_code=200, url=BASE_URL):
        return self.assertJSONResponse(self.client.get(url, params or {}), status_code)

    def get_results(self, params=None):
        return self.get_json(params)["results"]

    def get_ids(self, params=None):
        return [row["id"] for row in self.get_results(params)]

    def get_row(self, org_unit, params=None):
        """The single row for `org_unit` (filtered by id, so the rest of the fixture can't interfere)."""
        (row,) = self.get_results({**(params or {}), "id": org_unit.id})
        return row

    def get_error(self, params, status_code=400, url=BASE_URL):
        return self.get_json(params, status_code=status_code, url=url)

    def get_csv(self, params=None):
        """`(header, {org unit name: row dict})` of a `format=csv` export."""
        response = self.client.get(BASE_URL, {**(params or {}), "format": "csv"})
        header, *rows = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)
        rows_by_name = {row["name"]: row for row in (dict(zip(header, values)) for values in rows)}
        return header, rows_by_name
