from django.core.exceptions import ValidationError
from django.test import TestCase

from iaso.models import Account, OrgUnit
from iaso.models.base import Project
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import (
    LqasAbsenceStats,
    LqasActivityStats,
    LqasBaseModel,
    LqasCareGiverStats,
    LqasDistrictBaseModel,
    LqasEntry,
    LqasNoMarkStats,
)


class LqasBaseModelTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create country and district
        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type_id=1,
            validation_status="VALID",
            version=self.project.version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type_id=3,
            validation_status="VALID",
            version=self.project.version,
            parent=self.country,
        )

        # Create campaign and round
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

        # Create subactivity
        self.subactivity = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity",
        )

    def test_lqas_base_model_creation(self):
        """Test basic creation of LqasBaseModel subclasses"""
        stats = LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )
        self.assertEqual(stats.round, self.round)
        self.assertIsNone(stats.subactivity)

    def test_lqas_base_model_with_subactivity(self):
        """Test creation with valid subactivity"""
        stats = LqasActivityStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )
        self.assertEqual(stats.round, self.round)
        self.assertEqual(stats.subactivity, self.subactivity)

    def test_lqas_base_model_validation_same_round(self):
        """Test validation when subactivity belongs to same round"""
        stats = LqasActivityStats(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )
        # Should not raise ValidationError
        stats.full_clean()  # This should pass without exception

    def test_lqas_base_model_validation_different_round(self):
        """Test validation fails when subactivity belongs to different round"""
        # Create another round and subactivity
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
            subactivity=subactivity2,  # Different round
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )

        with self.assertRaises(ValidationError) as cm:
            stats.full_clean()

        self.assertIn("subactivity", cm.exception.error_dict)
        self.assertIn("SubActivity must belong to the same round", str(cm.exception))

    def test_lqas_base_model_str_representation(self):
        """Test string representation of models"""
        # Without subactivity
        stats = LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )
        self.assertIn("LQAS Activity Statistics", str(stats))
        self.assertIn(str(self.round), str(stats))

        # With subactivity
        stats_with_sub = LqasActivityStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )
        self.assertIn("LQAS Activity Statistics", str(stats_with_sub))
        self.assertIn(str(self.round), str(stats_with_sub))
        self.assertIn(str(self.subactivity), str(stats_with_sub))

    def test_lqas_base_model_unique_together(self):
        """Test unique_together constraint"""
        # Create first instance
        LqasActivityStats.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passeded=10,
            lqas_no_data=2,
        )

        # Try to create duplicate (should fail)
        with self.assertRaises(Exception) as cm:  # IntegrityError or ValidationError
            LqasActivityStats.objects.create(
                round=self.round,
                lqas_failed=3,
                lqas_passeded=8,
                lqas_no_data=1,
            )

        # Assert that it's either IntegrityError or ValidationError
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])


class LqasDistrictBaseModelTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create country and district
        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type_id=1,
            validation_status="VALID",
            version=self.project.version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type_id=3,
            validation_status="VALID",
            version=self.project.version,
            parent=self.country,
        )

        # Create campaign and round
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

        # Create subactivity
        self.subactivity = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity",
        )

    def test_lqas_district_base_model_creation(self):
        """Test basic creation of LqasDistrictBaseModel subclasses"""
        stats = LqasNoMarkStats.objects.create(
            round=self.round,
            district=self.district,
            other=1,
            child_absent=2,
            non_compliance=3,
            child_was_asleep=4,
            house_not_visited=5,
            child_is_a_visitor=6,
            vaccinated_but_not_fm=7,
        )
        self.assertEqual(stats.round, self.round)
        self.assertEqual(stats.district, self.district)
        self.assertIsNone(stats.subactivity)

    def test_lqas_district_base_model_with_subactivity(self):
        """Test creation with valid subactivity"""
        stats = LqasNoMarkStats.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            district=self.district,
            other=1,
            child_absent=2,
            non_compliance=3,
            child_was_asleep=4,
            house_not_visited=5,
            child_is_a_visitor=6,
            vaccinated_but_not_fm=7,
        )
        self.assertEqual(stats.round, self.round)
        self.assertEqual(stats.subactivity, self.subactivity)
        self.assertEqual(stats.district, self.district)

    def test_lqas_district_base_model_unique_together(self):
        """Test unique_together constraint includes district"""
        # Create first instance
        LqasNoMarkStats.objects.create(
            round=self.round,
            district=self.district,
            other=1,
            child_absent=2,
            non_compliance=3,
            child_was_asleep=4,
            house_not_visited=5,
            child_is_a_visitor=6,
            vaccinated_but_not_fm=7,
        )

        # Try to create duplicate (should fail)
        with self.assertRaises(Exception) as cm:  # IntegrityError or ValidationError
            LqasNoMarkStats.objects.create(
                round=self.round,
                district=self.district,
                other=3,
                child_absent=4,
                non_compliance=5,
                child_was_asleep=6,
                house_not_visited=7,
                child_is_a_visitor=8,
                vaccinated_but_not_fm=9,
            )

        # Assert that it's either IntegrityError or ValidationError
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_district_base_model_different_district(self):
        """Test that same round/subactivity can have different districts"""
        # Create another district
        district2 = OrgUnit.objects.create(
            name="Test District 2",
            org_unit_type_id=3,
            validation_status="VALID",
            version=self.project.version,
            parent=self.country,
        )

        # Create first instance
        LqasNoMarkStats.objects.create(
            round=self.round,
            district=self.district,
            other=1,
            child_absent=2,
            non_compliance=3,
            child_was_asleep=4,
            house_not_visited=5,
            child_is_a_visitor=6,
            vaccinated_but_not_fm=7,
        )

        # Create second instance with different district (should succeed)
        LqasNoMarkStats.objects.create(
            round=self.round,
            district=district2,
            other=3,
            child_absent=4,
            non_compliance=5,
            child_was_asleep=6,
            house_not_visited=7,
            child_is_a_visitor=8,
            vaccinated_but_not_fm=9,
        )


class LqasCareGiverStatsTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create country and district
        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type_id=1,
            validation_status="VALID",
            version=self.project.version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type_id=3,
            validation_status="VALID",
            version=self.project.version,
            parent=self.country,
        )

        # Create campaign and round
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

        # Create LqasEntry
        self.lqas_entry = LqasEntry.objects.create(
            round=self.round,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
        )

    def test_lqas_care_giver_stats_creation(self):
        """Test basic creation of LqasCareGiverStats"""
        stats = LqasCareGiverStats.objects.create(
            lqas_entry=self.lqas_entry,
            ratio=0.85,
            best_info_source="health_worker",
            caregivers_informed=80,
            caregivers_informed_ratio=0.84,
        )
        self.assertEqual(stats.lqas_entry, self.lqas_entry)
        self.assertEqual(stats.ratio, 0.85)
        self.assertEqual(stats.best_info_source, "health_worker")
        self.assertEqual(stats.caregivers_informed, 80)
        self.assertEqual(stats.caregivers_informed_ratio, 0.84)

    def test_lqas_care_giver_stats_relationship(self):
        """Test relationship between LqasEntry and LqasCareGiverStats"""
        stats = LqasCareGiverStats.objects.create(
            lqas_entry=self.lqas_entry,
            ratio=0.85,
            best_info_source="health_worker",
            caregivers_informed=80,
            caregivers_informed_ratio=0.84,
        )

        # Test reverse relationship
        self.assertIn(stats, self.lqas_entry.caregiver_stats.all())


class LqasModelsInheritanceTestCase(TestCase):
    """Test that inheritance works correctly for all LQAS models"""

    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create country and district
        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type_id=1,
            validation_status="VALID",
            version=self.project.version,
        )
        self.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type_id=3,
            validation_status="VALID",
            version=self.project.version,
            parent=self.country,
        )

        # Create campaign and round
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

        # Create subactivity
        self.subactivity = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity",
        )

    def test_all_models_inherit_validation(self):
        """Test that all LQAS models inherit validation logic"""
        models_to_test = [
            (LqasActivityStats, {"lqas_failed": 5, "lqas_passeded": 10, "lqas_no_data": 2}),
            (LqasEntry, {"total_children_fmd": 100, "total_children_checked": 95, "total_sites_visited": 10}),
            (
                LqasNoMarkStats,
                {
                    "district": self.district,
                    "other": 1,
                    "child_absent": 2,
                    "non_compliance": 3,
                    "child_was_asleep": 4,
                    "house_not_visited": 5,
                    "child_is_a_visitor": 6,
                    "vaccinated_but_not_fm": 7,
                },
            ),
            (
                LqasAbsenceStats,
                {
                    "district": self.district,
                    "farm": 1,
                    "other": 2,
                    "market": 3,
                    "school": 4,
                    "travelled": 5,
                    "in_playground": 6,
                },
            ),
        ]

        for model_class, fields in models_to_test:
            # Test valid creation
            instance = model_class.objects.create(round=self.round, **fields)
            self.assertEqual(instance.round, self.round)

            # Test validation with valid subactivity
            instance_with_sub = model_class.objects.create(round=self.round, subactivity=self.subactivity, **fields)
            self.assertEqual(instance_with_sub.subactivity, self.subactivity)

            # Test validation with invalid subactivity (different round)
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

            invalid_instance = model_class(
                round=self.round,
                subactivity=subactivity2,  # Different round
                **fields,
            )

            with self.assertRaises(ValidationError) as cm:
                invalid_instance.full_clean()

            # Assert that the error message contains the expected text
            self.assertIn("SubActivity must belong to the same round", str(cm.exception))

    def test_abstract_models_not_created(self):
        """Test that abstract models don't create database tables"""
        # These should not have database tables
        self.assertFalse(hasattr(LqasBaseModel, "_meta"))
        self.assertFalse(hasattr(LqasDistrictBaseModel, "_meta"))

        # Or if they do have _meta, they should be abstract
        if hasattr(LqasBaseModel, "_meta"):
            self.assertTrue(LqasBaseModel._meta.abstract)
        if hasattr(LqasDistrictBaseModel, "_meta"):
            self.assertTrue(LqasDistrictBaseModel._meta.abstract)
