from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasRoundData, LqasStatuses


class LqasRoundDataTestCase(TestCase):
    """Test cases for LqasRoundData model"""

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

    def test_lqas_round_data_creation(self):
        """Test basic creation of LqasRoundData"""
        round_data = LqasRoundData.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        self.assertEqual(round_data.round, self.round)
        self.assertIsNone(round_data.subactivity)
        self.assertEqual(round_data.status, LqasStatuses.INSCOPE)
        self.assertEqual(round_data.lqas_failed, 5)
        self.assertEqual(round_data.lqas_passed, 10)
        self.assertEqual(round_data.lqas_no_data, 2)

        # Assert NFM (No Finger Mark) fields
        self.assertEqual(round_data.nfm_child_absent, 3)
        self.assertEqual(round_data.nfm_other, 1)
        self.assertEqual(round_data.nfm_non_compliance, 2)
        self.assertEqual(round_data.nfm_child_was_asleep, 1)
        self.assertEqual(round_data.nfm_house_not_visited, 0)
        self.assertEqual(round_data.nfm_child_is_a_visitor, 1)
        self.assertEqual(round_data.nfm_vaccinated_but_not_fm, 2)

        # Assert absence fields
        self.assertEqual(round_data.abs_farm, 2)
        self.assertEqual(round_data.abs_other, 1)
        self.assertEqual(round_data.abs_market, 1)
        self.assertEqual(round_data.abs_school, 3)
        self.assertEqual(round_data.abs_travelled, 1)
        self.assertEqual(round_data.abs_in_playground, 0)
        self.assertEqual(round_data.abs_unknown, 1)

    def test_lqas_round_data_with_subactivity(self):
        """Test creation with valid subactivity"""
        round_data = LqasRoundData.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            status=LqasStatuses.LQASOK,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        self.assertEqual(round_data.round, self.round)
        self.assertEqual(round_data.subactivity, self.subactivity)
        self.assertEqual(round_data.status, LqasStatuses.LQASOK)
        self.assertEqual(round_data.lqas_failed, 5)
        self.assertEqual(round_data.lqas_passed, 10)
        self.assertEqual(round_data.lqas_no_data, 2)

        # Assert NFM (No Finger Mark) fields
        self.assertEqual(round_data.nfm_child_absent, 3)
        self.assertEqual(round_data.nfm_other, 1)
        self.assertEqual(round_data.nfm_non_compliance, 2)
        self.assertEqual(round_data.nfm_child_was_asleep, 1)
        self.assertEqual(round_data.nfm_house_not_visited, 0)
        self.assertEqual(round_data.nfm_child_is_a_visitor, 1)
        self.assertEqual(round_data.nfm_vaccinated_but_not_fm, 2)

        # Assert absence fields
        self.assertEqual(round_data.abs_farm, 2)
        self.assertEqual(round_data.abs_other, 1)
        self.assertEqual(round_data.abs_market, 1)
        self.assertEqual(round_data.abs_school, 3)
        self.assertEqual(round_data.abs_travelled, 1)
        self.assertEqual(round_data.abs_in_playground, 0)
        self.assertEqual(round_data.abs_unknown, 1)

    def test_lqas_round_data_validationsubactivity_from_same_round(self):
        """Test validation when subactivity belongs to same round"""
        round_data = LqasRoundData(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        # Should not raise ValidationError
        round_data.full_clean()

    def test_lqas_round_data_validation_subactivity_from_different_round(self):
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

        round_data = LqasRoundData(
            round=self.round,
            subactivity=subactivity2,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        with self.assertRaises(ValidationError):
            round_data.full_clean()

    def test_lqas_round_data_unique_constraint_round_only(self):
        """Test unique constraint for round without subactivity"""
        LqasRoundData.objects.create(
            round=self.round,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasRoundData.objects.create(
                round=self.round,
                lqas_failed=3,
                lqas_passed=8,
                lqas_no_data=1,
                nfm_child_absent=2,
                nfm_other=1,
                nfm_non_compliance=1,
                nfm_child_was_asleep=1,
                nfm_house_not_visited=0,
                nfm_child_is_a_visitor=1,
                nfm_vaccinated_but_not_fm=1,
                abs_farm=1,
                abs_other=1,
                abs_market=1,
                abs_school=2,
                abs_travelled=1,
                abs_in_playground=0,
                abs_unknown=1,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_round_data_unique_constraint_round_subactivity(self):
        """Test unique constraint for round with subactivity"""
        LqasRoundData.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasRoundData.objects.create(
                round=self.round,
                subactivity=self.subactivity,
                lqas_failed=3,
                lqas_passed=8,
                lqas_no_data=1,
                nfm_child_absent=2,
                nfm_other=1,
                nfm_non_compliance=1,
                nfm_child_was_asleep=1,
                nfm_house_not_visited=0,
                nfm_child_is_a_visitor=1,
                nfm_vaccinated_but_not_fm=1,
                abs_farm=1,
                abs_other=1,
                abs_market=1,
                abs_school=2,
                abs_travelled=1,
                abs_in_playground=0,
                abs_unknown=1,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_round_data_different_subactivities_same_round(self):
        """Test that different subactivities in same round are allowed"""
        subactivity2 = SubActivity.objects.create(
            round=self.round,
            name="Test SubActivity 2",
        )

        LqasRoundData.objects.create(
            round=self.round,
            subactivity=self.subactivity,
            lqas_failed=5,
            lqas_passed=10,
            lqas_no_data=2,
            nfm_child_absent=3,
            nfm_other=1,
            nfm_non_compliance=2,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=2,
            abs_farm=2,
            abs_other=1,
            abs_market=1,
            abs_school=3,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        # Should allow different subactivity
        round_data2 = LqasRoundData.objects.create(
            round=self.round,
            subactivity=subactivity2,
            lqas_failed=3,
            lqas_passed=8,
            lqas_no_data=1,
            nfm_child_absent=2,
            nfm_other=1,
            nfm_non_compliance=1,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=0,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=1,
            abs_farm=1,
            abs_other=1,
            abs_market=1,
            abs_school=2,
            abs_travelled=1,
            abs_in_playground=0,
            abs_unknown=1,
        )
        self.assertEqual(round_data2.subactivity, subactivity2)

    def test_lqas_round_data_json_keys(self):
        """Test JSON keys mapping"""
        expected_keys = {
            "lqas_failed": "lqas_failed",
            "lqas_passed": "lqas_passed",
            "lqas_no_data": "lqas_no_data",
            "status": "status",
        }
        self.assertEqual(LqasRoundData.JSON_KEYS, expected_keys)

    def test_lqas_round_data_nfm_json_keys(self):
        """Test NFM JSON keys mapping"""
        expected_keys = {
            "nfm_child_absent": "childabsent",
            "nfm_other": "Other",
            "nfm_non_compliance": "Non_Compliance",
            "nfm_child_was_asleep": "Child_was_asleep",
            "nfm_house_not_visited": "House_not_visited",
            "nfm_child_is_a_visitor": "Child_is_a_visitor",
            "nfm_vaccinated_but_not_fm": "Vaccinated_but_not_FM",
        }
        self.assertEqual(LqasRoundData.NFM_JSON_KEYS, expected_keys)

    def test_lqas_round_data_abs_json_keys(self):
        """Test absence JSON keys mapping"""
        expected_keys = {
            "abs_farm": "Farm",
            "abs_other": "Other",
            "abs_market": "Market",
            "abs_school": "School",
            "abs_travelled": "Travelled",
            "abs_in_playground": "In_playground",
            "abs_unknown": "unknown",
        }
        self.assertEqual(LqasRoundData.ABS_JSON_KEYS, expected_keys)
