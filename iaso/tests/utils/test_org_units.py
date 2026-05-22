from django.contrib.gis.geos import MultiPolygon, Point, Polygon

from iaso import models as m
from iaso.models.base import Account
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase
from iaso.utils.org_units import get_valid_org_units_with_geography


class OrgUnitUtilsTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)

        cls.account = Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            username="jane_doe",
            last_name="Doe",
            first_name="Jane",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        cls.data_source2 = m.DataSource.objects.create(name="Data source 2")
        cls.source_version2 = m.SourceVersion.objects.create(number=1, data_source=cls.data_source2)

        # Angola.
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        cls.angola_district = m.OrgUnit.objects.create(
            name="Cuvango",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2", "3"],
            version=cls.source_version,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )
        cls.angola_district_new = m.OrgUnit.objects.create(
            name="Cuvango NEW",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_NEW,
            path=["1", "2", "4"],
            version=cls.source_version,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )
        cls.angola_district_rejected = m.OrgUnit.objects.create(
            name="Cuvango REJECTED",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
            path=["1", "2", "5"],
            version=cls.source_version,
        )
        cls.angola_district_wrong_user = m.OrgUnit.objects.create(
            name="Cuvango Wrong user",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2", "6"],
            version=cls.source_version2,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )

        cls.angola_district_missing_geom = m.OrgUnit.objects.create(
            name="Cuvango Missing Geom",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2", "7"],
            version=cls.source_version2,
            location=Point(x=4, y=50, z=100),
        )

        cls.angola_district_missing_location = m.OrgUnit.objects.create(
            name="Cuvango Missing Location",
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2", "8"],
            version=cls.source_version2,
            geom=cls.mock_multipolygon,
        )

    def test_filter_valid_org_units_for_account(self):
        filtered_qs = get_valid_org_units_with_geography(self.account)
        self.assertIn(self.angola_district, filtered_qs)
        self.assertNotIn(self.angola_district_new, filtered_qs)  # New status
        self.assertNotIn(self.angola_district_rejected, filtered_qs)  # Rejected status
        self.assertNotIn(self.angola_district_wrong_user, filtered_qs)  # Different version not linked to account

        self.assertNotIn(self.angola_district_missing_geom, filtered_qs)  # Missing geom and location
        self.assertNotIn(self.angola_district_missing_location, filtered_qs)  # Missing geom and location
