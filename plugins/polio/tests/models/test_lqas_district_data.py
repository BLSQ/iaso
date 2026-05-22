from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OrgUnit, OrgUnitType
from iaso.models.base import Project
from iaso.models.data_source import DataSource, SourceVersion
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasDistrictData, LqasStatuses


class LqasDistrictDataTestCase(TestCase):
    """Test cases for LqasDistrictData model"""

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

    def test_lqas_district_data_creation(self):
        """Test basic creation of LqasDistrictData"""
        district_data = LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        self.assertEqual(district_data.round, self.round)
        self.assertEqual(district_data.district, self.district)
        self.assertIsNone(district_data.subactivity)
        self.assertEqual(district_data.total_children_fmd, 100)
        self.assertEqual(district_data.total_children_checked, 95)
        self.assertEqual(district_data.total_sites_visited, 10)
        self.assertEqual(district_data.status, LqasStatuses.INSCOPE)

        # Assert caregiver fields
        self.assertEqual(district_data.cg_ratio, 0.85)
        self.assertEqual(district_data.cg_best_info_source, "Health Worker")
        self.assertEqual(district_data.cg_best_info_ratio, 0.90)
        self.assertEqual(district_data.cg_caregivers_informed, 80)
        self.assertEqual(district_data.cg_caregivers_informed_ratio, 0.84)

    def test_lqas_district_data_with_subactivity(self):
        """Test creation with valid subactivity"""
        district_data = LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            subactivity=self.subactivity,
            total_children_fmd=80,
            total_children_checked=75,
            total_sites_visited=8,
            status=LqasStatuses.LQASOK,
            cg_ratio=0.80,
            cg_best_info_source="Community Worker",
            cg_best_info_ratio=0.85,
            cg_caregivers_informed=60,
            cg_caregivers_informed_ratio=0.80,
        )
        self.assertEqual(district_data.round, self.round)
        self.assertEqual(district_data.district, self.district)
        self.assertEqual(district_data.subactivity, self.subactivity)
        self.assertEqual(district_data.status, LqasStatuses.LQASOK)

        # Assert caregiver fields
        self.assertEqual(district_data.cg_ratio, 0.80)
        self.assertEqual(district_data.cg_best_info_source, "Community Worker")
        self.assertEqual(district_data.cg_best_info_ratio, 0.85)
        self.assertEqual(district_data.cg_caregivers_informed, 60)
        self.assertEqual(district_data.cg_caregivers_informed_ratio, 0.80)

    def test_lqas_district_data_validation_subactivity_from_same_round(self):
        """Test validation when subactivity belongs to same round"""
        district_data = LqasDistrictData(
            round=self.round,
            district=self.district,
            subactivity=self.subactivity,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        # Should not raise ValidationError
        district_data.full_clean()

    def test_lqas_district_data_validation_subactivity_from_different_round(self):
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

        district_data = LqasDistrictData(
            round=self.round,
            district=self.district,
            subactivity=subactivity2,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        with self.assertRaises(ValidationError):
            district_data.full_clean()

    def test_lqas_district_data_different_districts_same_round(self):
        """Test that different districts in same round are allowed"""
        district2 = OrgUnit.objects.create(
            name="Test District 2",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
            parent=self.country,
        )

        LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        # Should allow different district
        district_data2 = LqasDistrictData.objects.create(
            round=self.round,
            district=district2,
            total_children_fmd=80,
            total_children_checked=75,
            total_sites_visited=8,
            cg_ratio=0.80,
            cg_best_info_source="Community Worker",
            cg_best_info_ratio=0.85,
            cg_caregivers_informed=60,
            cg_caregivers_informed_ratio=0.80,
        )
        self.assertEqual(district_data2.district, district2)

    def test_lqas_district_data_unique_constraint_round_district(self):
        """Test unique constraint for round and district without subactivity"""
        LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasDistrictData.objects.create(
                round=self.round,
                district=self.district,
                total_children_fmd=90,
                total_children_checked=85,
                total_sites_visited=9,
                cg_ratio=0.80,
                cg_best_info_source="Community Worker",
                cg_best_info_ratio=0.85,
                cg_caregivers_informed=70,
                cg_caregivers_informed_ratio=0.82,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_district_data_unique_constraint_round_district_subactivity(self):
        """Test unique constraint for round, district, and subactivity"""
        LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            subactivity=self.subactivity,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        # Should not allow duplicate
        with self.assertRaises((IntegrityError, ValidationError)) as cm:
            LqasDistrictData.objects.create(
                round=self.round,
                district=self.district,
                subactivity=self.subactivity,
                total_children_fmd=90,
                total_children_checked=85,
                total_sites_visited=9,
                cg_ratio=0.80,
                cg_best_info_source="Community Worker",
                cg_best_info_ratio=0.85,
                cg_caregivers_informed=70,
                cg_caregivers_informed_ratio=0.82,
            )
        self.assertIn(type(cm.exception).__name__, ["IntegrityError", "ValidationError"])

    def test_lqas_district_data_json_keys(self):
        """Test JSON keys mapping"""
        expected_keys = {
            "total_children_fmd": "total_child_fmd",
            "total_children_checked": "total_child_checked",
            "total_sites_visited": "total_sites_visited",
            "status": "status",
            "care_giver_stats": "care_giver_stats",
        }
        self.assertEqual(LqasDistrictData.JSON_KEYS, expected_keys)

    def test_lqas_district_data_cg_json_keys(self):
        """Test caregiver JSON keys mapping"""
        expected_keys = {
            "cg_ratio": "ratio",
            "cg_caregivers_informed": "caregivers_informed",
            "cg_caregivers_informed_ratio": "caregivers_informed_ratio",
        }
        self.assertEqual(LqasDistrictData.CG_JSON_KEYS, expected_keys)

    def test_lqas_district_data_default_status(self):
        """Test that status defaults to INSCOPE"""
        district_data = LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        self.assertEqual(district_data.status, LqasStatuses.INSCOPE)

    def test_lqas_district_data_custom_status(self):
        """Test setting custom status"""
        district_data = LqasDistrictData.objects.create(
            round=self.round,
            district=self.district,
            total_children_fmd=100,
            total_children_checked=95,
            total_sites_visited=10,
            status=LqasStatuses.LQASOK,
            cg_ratio=0.85,
            cg_best_info_source="Health Worker",
            cg_best_info_ratio=0.90,
            cg_caregivers_informed=80,
            cg_caregivers_informed_ratio=0.84,
        )
        self.assertEqual(district_data.status, LqasStatuses.LQASOK)
