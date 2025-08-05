from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasActivityStats, LqasBaseModel, LqasStatuses


class LqasActivityStatsTestCase(TestCase):
    """Test cases for LqasActivityStats model"""

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

    def test_lqas_activity_stats_creation(self):
        """Test basic creation of LqasActivityStats"""
        stats = LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        self.assertEqual(stats.round, self.round)
        self.assertIsNone(stats.subactivity)
        self.assertEqual(stats.status, LqasStatuses.INSCOPE)
        self.assertEqual(stats.lqas_failed, 5)
        self.assertEqual(stats.lqas_passed, 10)
        self.assertEqual(stats.lqas_no_data, 2)

    def test_lqas_activity_stats_with_subactivity(self):
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

    def test_lqas_activity_stats_validation_same_round(self):
        """Test validation when subactivity belongs to same round"""
        stats = LqasActivityStats(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        # Should not raise ValidationError
        stats.full_clean()

    def test_lqas_activity_stats_validation_subactivity_from_different_round(self):
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

        stats = LqasActivityStats(
            round=self.round,
            subactivity=subactivity2,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        with self.assertRaises(ValidationError):
            stats.full_clean()

    def test_lqas_activity_stats_inherits_from_base(self):
        """Test that LqasActivityStats inherits from LqasBaseModel"""
        self.assertTrue(issubclass(LqasActivityStats, LqasBaseModel))

    def test_lqas_activity_stats_unique_constraint_round_only(self):
        """Test unique constraint for round without subactivity"""
        LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasActivityStats.objects.create(
                round=self.round,
                lqas_failed=3,
                lqas_passed=8,
                lqas_no_data=1,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_activity_stats_unique_constraint_round_subactivity(self):
        """Test unique constraint for round with subactivity"""
        LqasActivityStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasActivityStats.objects.create(
                round=self.round,
                subactivity=self.subactivity,
                lqas_failed=3,
                lqas_passed=8,
                lqas_no_data=1,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_activity_stats_different_subactivities_same_round(self):
        """Test that different subactivities in same round are allowed"""
        subactivity2 = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity 2",
        )

        LqasActivityStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
        )
        # Should allow different subactivity
        stats2 = LqasActivityStats.objects.create(
            round=self.round,
            subactivity=subactivity2,
            lqas_failed=3,
            lqas_passed=8,
            lqas_no_data=1,
        )
        self.assertEqual(stats2.subactivity, subactivity2)
