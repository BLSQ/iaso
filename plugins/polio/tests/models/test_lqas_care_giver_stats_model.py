from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasCareGiverStats, LqasEntry


class LqasCareGiverStatsTestCase(TestCase):
    """Test cases for LqasCareGiverStats model"""

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

        self.lqas_entry = LqasEntry.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=50,
            total_children_checked=60,
            total_sites_visited=10,
        )

    def test_lqas_care_giver_stats_creation(self):
        """Test basic creation of LqasCareGiverStats"""
        stats = LqasCareGiverStats.objects.create(
            lqas_entry=self.lqas_entry,
            ratio=0.85,
            best_info_source="Health Worker",
            best_info_ratio=0.90,
            caregivers_informed=80,
            caregivers_informed_ratio=0.84,
        )
        self.assertEqual(stats.lqas_entry, self.lqas_entry)
        self.assertEqual(stats.ratio, 0.85)
        self.assertEqual(stats.best_info_source, "Health Worker")
        self.assertEqual(stats.best_info_ratio, 0.90)
        self.assertEqual(stats.caregivers_informed, 80)
        self.assertEqual(stats.caregivers_informed_ratio, 0.84)

    def test_lqas_care_giver_stats_relationship(self):
        """Test relationship between LqasEntry and LqasCareGiverStats"""
        stats = LqasCareGiverStats.objects.create(
            lqas_entry=self.lqas_entry,
            ratio=0.85,
            best_info_source="Health Worker",
            best_info_ratio=0.90,
            caregivers_informed=80,
            caregivers_informed_ratio=0.84,
        )

        # Test reverse relationship
        self.assertEqual(self.lqas_entry.caregiver_stats, stats)
        # Test one-to-one constraint
        with self.assertRaises(IntegrityError):
            LqasCareGiverStats.objects.create(
                lqas_entry=self.lqas_entry,
                ratio=0.75,
                best_info_source="Radio",
                best_info_ratio=0.80,
                caregivers_informed=70,
                caregivers_informed_ratio=0.74,
            )
