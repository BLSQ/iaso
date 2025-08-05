from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasAbsenceStats, LqasBaseModel


class LqasAbsenceStatsTestCase(TestCase):
    """Test cases for LqasAbsenceStats model"""

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

    def test_lqas_absence_stats_json_keys(self):
        """Test JSON keys mapping"""
        expected_keys = {
            "farm": "Farm",
            "other": "Other",
            "market": "Market",
            "school": "School",
            "travelled": "Travelled",
            "in_playground": "In_playground",
            "unknown": "unknown",
        }
        self.assertEqual(LqasAbsenceStats.JSON_KEYS, expected_keys)

    def test_lqas_absence_stats_validation_subactivity_from_different_round(self):
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
        # Subactivity from different round
        stats = LqasAbsenceStats(
            round=self.round,
            subactivity=subactivity2,
            farm=5,
            other=10,
            market=3,
            school=2,
            travelled=1,
            in_playground=4,
            unknown=6,
        )
        with self.assertRaises(ValidationError):
            stats.full_clean()

    def test_lqas_absence_stats_inherits_from_base(self):
        """Test that LqasAbsenceStats inherits from LqasBaseModel"""
        self.assertTrue(issubclass(LqasAbsenceStats, LqasBaseModel))

    def test_lqas_absence_stats_unique_constraint_round_only(self):
        """Test unique constraint for round without subactivity"""
        LqasAbsenceStats.objects.create(
            round=self.round,
            farm=5,
            other=10,
            market=3,
            school=2,
            travelled=1,
            in_playground=4,
            unknown=6,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasAbsenceStats.objects.create(
                round=self.round,
                farm=3,
                other=8,
                market=2,
                school=1,
                travelled=0,
                in_playground=3,
                unknown=4,
            )

        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_absence_stats_unique_constraint_round_subactivity(self):
        """Test unique constraint for round with subactivity"""
        LqasAbsenceStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            farm=5,
            other=10,
            market=3,
            school=2,
            travelled=1,
            in_playground=4,
            unknown=6,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasAbsenceStats.objects.create(
                round=self.round,
                subactivity=self.subactivity,
                farm=3,
                other=8,
                market=2,
                school=1,
                travelled=0,
                in_playground=3,
                unknown=4,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])
