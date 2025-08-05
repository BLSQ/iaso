from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import (
    LqasActivityStats,
    LqasBaseModel,
    LqasDistrictBaseModel,
    LqasEntry,
    LqasStatuses,
)


class LqasBaseModelTestCase(TestCase):
    """Test cases for LqasBaseModel"""

    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create DataSource and SourceVersion
        self.data_source = DataSource.objects.create(name="Test Data Source")
        self.data_source.projects.add(self.project)
        self.data_source.save()
        self.source_version = SourceVersion.objects.create(data_source=self.data_source, number=1)

        # Create OrgUnitType
        self.country_type = OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        self.district_type = OrgUnitType.objects.create(name="District", depth=3, category="DISTRICT")

        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type=self.country_type,
            validation_status="VALID",
            version=self.source_version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
            parent=self.country,
        )

        self.campaign = Campaign.objects.create(
            obr_name="Test Campaign",
            account=self.account,
            country=self.country,
        )
        self.round = Round.objects.create(
            campaign=self.campaign,
            number=1,
            started_at="2024-01-01",
            ended_at="2024-01-31",
        )

        self.subactivity = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity",
        )

    def test_lqas_base_model_creation(self):
        """Test basic creation of LqasBaseModel subclasses"""
        stats = LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            status=LqasStatuses.INSCOPE,
        )
        self.assertEqual(stats.round, self.round)
        self.assertIsNone(stats.subactivity)
        self.assertEqual(stats.status, LqasStatuses.INSCOPE)
        self.assertEqual(stats.lqas_failed, 5)
        self.assertEqual(stats.lqas_passed, 10)
        self.assertEqual(stats.lqas_no_data, 2)

    def test_lqas_base_model_with_subactivity(self):
        """Test creation with valid subactivity"""
        stats = LqasActivityStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            status=LqasStatuses.LQASOK,
        )
        self.assertEqual(stats.round, self.round)
        self.assertEqual(stats.subactivity, self.subactivity)
        self.assertEqual(stats.status, LqasStatuses.LQASOK)
        self.assertEqual(stats.lqas_failed, 5)
        self.assertEqual(stats.lqas_passed, 10)
        self.assertEqual(stats.lqas_no_data, 2)

    def test_lqas_base_model_abstract(self):
        """Test that LqasBaseModel is abstract"""
        self.assertTrue(LqasBaseModel._meta.abstract)


class LqasDistrictBaseModelTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create DataSource and SourceVersion
        self.data_source = DataSource.objects.create(name="Test Data Source")
        self.data_source.projects.add(self.project)
        self.data_source.save()
        self.source_version = SourceVersion.objects.create(data_source=self.data_source, number=1)

        # Create OrgUnitType
        self.country_type = OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        self.district_type = OrgUnitType.objects.create(name="District", depth=3, category="DISTRICT")

        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type=self.country_type,
            validation_status="VALID",
            version=self.source_version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
            parent=self.country,
        )

        self.campaign = Campaign.objects.create(
            obr_name="Test Campaign",
            account=self.account,
            country=self.country,
        )
        self.round = Round.objects.create(
            campaign=self.campaign,
            number=1,
            started_at="2024-01-01",
            ended_at="2024-01-31",
        )

        self.subactivity = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity",
        )

    def test_lqas_district_base_model_creation(self):
        """Test basic creation of LqasDistrictBaseModel subclasses"""
        entry = LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        self.assertEqual(entry.round, self.round)
        self.assertEqual(entry.district, self.district)
        self.assertIsNone(entry.subactivity)
        self.assertEqual(entry.total_children_fmd, 100)
        self.assertEqual(entry.total_children_checked, 95)
        self.assertEqual(entry.total_sites_visited, 10)

    def test_lqas_district_base_model_with_subactivity(self):
        """Test creation with valid subactivity"""
        entry = LqasEntry.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        self.assertEqual(entry.round, self.round)
        self.assertEqual(entry.subactivity, self.subactivity)
        self.assertEqual(entry.district, self.district)
        self.assertEqual(entry.total_children_fmd, 100)
        self.assertEqual(entry.total_children_checked, 95)
        self.assertEqual(entry.total_sites_visited, 10)

    def test_lqas_district_base_model_abstract(self):
        """Test that LqasDistrictBaseModel is abstract"""
        self.assertTrue(LqasDistrictBaseModel._meta.abstract)
