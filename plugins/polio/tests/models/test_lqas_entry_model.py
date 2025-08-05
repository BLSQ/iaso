from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasDistrictBaseModel, LqasEntry, LqasStatuses


class LqasEntryTestCase(TestCase):
    """Test cases for LqasEntry model"""

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

    def test_lqas_entry_creation(self):
        """Test basic creation of LqasEntry"""
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
        self.assertEqual(entry.status, LqasStatuses.INSCOPE)

    def test_lqas_entry_with_subactivity(self):
        """Test creation with subactivity"""
        entry = LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            subactivity=self.subactivity,
            total_children_fmd=80,
            total_children_checked=75,
            total_sites_visited=8,
            status=LqasStatuses.LQASOK,
        )
        self.assertEqual(entry.round, self.round)
        self.assertEqual(entry.district, self.district)
        self.assertEqual(entry.subactivity, self.subactivity)
        self.assertEqual(entry.status, LqasStatuses.LQASOK)

    def test_lqas_entry_different_districts_same_round(self):
        """Test that different districts in same round are allowed"""
        district2 = OrgUnit.objects.create(
            name="Test District 2",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
            parent=self.country,
        )

        LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        # Should allow different district
        entry2 = LqasEntry.objects.create(
            round=self.round,
            district=district2,
            total_children_fmd=80,
            total_children_checked=75,
            total_sites_visited=8,
        )
        self.assertEqual(entry2.district, district2)

    def test_lqas_entry_validation_different_round(self):
        """Test validation fails when subactivity belongs to different round"""
        round2 = Round.objects.create(
            campaign=self.campaign,
            number=2,
            started_at="2024-02-01",
            ended_at="2024-02-28",
        )
        subactivity2 = SubActivity.objects.create(
            round=round2,
            name="Test SubActivity 2",
        )
        # Subactivity is from diffrent round
        entry = LqasEntry(
            round=self.round,
            district=self.district,
            subactivity=subactivity2,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        with self.assertRaises(ValidationError):
            entry.full_clean()

    def test_lqas_entry_inherits_from_district_base(self):
        """Test that LqasEntry inherits from LqasDistrictBaseModel"""
        self.assertTrue(issubclass(LqasEntry, LqasDistrictBaseModel))

    def test_lqas_entry_unique_constraint_round_district(self):
        """Test unique constraint for round and district without subactivity"""
        LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasEntry.objects.create(
                round=self.round,
                district=self.district,
                total_children_fmd=90,
                total_children_checked=85,
                total_sites_visited=9,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_entry_unique_constraint_round_district_subactivity(self):
        """Test unique constraint for round, district, and subactivity"""
        LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            subactivity=self.subactivity,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasEntry.objects.create(
                round=self.round,
                district=self.district,
                subactivity=self.subactivity,
                total_children_fmd=90,
                total_children_checked=85,
                total_sites_visited=9,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])
