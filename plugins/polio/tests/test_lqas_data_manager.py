from unittest.mock import patch

from django.test import TestCase

from iaso.models.base import Account, Project
from iaso.models.data_source import DataSource, SourceVersion
from iaso.models.org_unit import OrgUnit, OrgUnitType
from plugins.polio.api.lqas_im.lqas_data_manager import LqasDataManager
from plugins.polio.models.base import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import (
    LqasDistrictData,
    LqasRoundData,
    LqasStatuses,
)


class LqasDataManagerTestCase(TestCase):
    def setUp(self):
        """Set up test data for LQAS data manager tests"""
        self.account = Account.objects.create(name="Test Account")
        self.project = Project.objects.create(name="Test Project", account=self.account)

        # Create DataSource and SourceVersion
        self.data_source = DataSource.objects.create(name="Test Data Source")
        self.data_source.projects.add(self.project)
        self.data_source.save()
        self.source_version = SourceVersion.objects.create(data_source=self.data_source, number=1)

        # Create org unit types
        self.country_type = OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        self.district_type = OrgUnitType.objects.create(name="DISTRICT", depth=3, category="DISTRICT")

        # Create org units
        self.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type=self.country_type,
            validation_status="VALID",
            version=self.source_version,
        )
        self.district1 = OrgUnit.objects.create(
            name="Test District 1",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
            parent=self.country,
        )
        self.district2 = OrgUnit.objects.create(
            name="Test District 2",
            org_unit_type=self.district_type,
            validation_status="VALID",
            version=self.source_version,
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

        # Sample LQAS JSON data
        self.sample_lqas_data = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "lqas_no_data": 0,
                            "status": "inScope",
                            "nfm_stats": {
                                "childabsent": 5,
                                "Other": 2,
                                "Non_Compliance": 1,
                                "Child_was_asleep": 3,
                                "House_not_visited": 0,
                                "Child_is_a_visitor": 1,
                                "Vaccinated_but_not_FM": 2,
                            },
                            "nfm_abs_stats": {
                                "Farm": 3,
                                "Other": 1,
                                "Market": 2,
                                "School": 4,
                                "Travelled": 1,
                                "In_playground": 0,
                                "unknown": 1,
                            },
                            "data": {
                                "Test District 1": {
                                    "total_child_fmd": 45,
                                    "total_child_checked": 50,
                                    "total_sites_visited": 10,
                                    "status": "inScope",
                                    "district": self.district1.id,
                                    "care_giver_stats": {
                                        "ratio": 0.9,
                                        "caregivers_informed": 45,
                                        "caregivers_informed_ratio": 0.9,
                                        "health_worker": 30,
                                        "community_worker": 15,
                                    },
                                },
                                "Test District 2": {
                                    "total_child_fmd": 38,
                                    "total_child_checked": 40,
                                    "total_sites_visited": 8,
                                    "status": "inScope",
                                    "district": self.district2.id,
                                    "care_giver_stats": {
                                        "ratio": 0.95,
                                        "caregivers_informed": 38,
                                        "caregivers_informed_ratio": 0.95,
                                        "health_worker": 25,
                                        "community_worker": 13,
                                    },
                                },
                            },
                        }
                    ]
                }
            }
        }

    def test_init_with_account_object(self):
        """Test initialization with account object"""
        manager = LqasDataManager(account=self.account)
        self.assertEqual(manager.account, self.account)

    def test_init_with_account_id(self):
        """Test initialization with account ID"""
        manager = LqasDataManager(account_id=self.account.id)
        self.assertEqual(manager.account, self.account)

    def test_init_with_both_account_and_account_id_raises_error(self):
        """Test that providing both account and account_id raises ValueError"""
        with self.assertRaises(ValueError) as context:
            LqasDataManager(account=self.account, account_id=self.account.id)
        self.assertIn("Cannot specify both account and account_id", str(context.exception))

    def test_init_with_invalid_account_type_raises_error(self):
        """Test that providing invalid account type raises TypeError"""
        with self.assertRaises(TypeError) as context:
            LqasDataManager(account="invalid")
        self.assertIn("account must be an Account instance", str(context.exception))

    def test_init_with_invalid_account_id_type_raises_error(self):
        """Test that providing invalid account_id type raises TypeError"""
        with self.assertRaises(TypeError) as context:
            LqasDataManager(account_id="invalid")
        self.assertIn("account_id must be an integer", str(context.exception))

    def test_init_with_nonexistent_account_id_raises_error(self):
        """Test that providing nonexistent account_id raises ValueError"""
        with self.assertRaises(ValueError) as context:
            LqasDataManager(account_id=99999)
        self.assertIn("Account with ID 99999 does not exist", str(context.exception))

    def test_init_without_account_raises_error(self):
        """Test that not providing account raises ValueError"""
        with self.assertRaises(ValueError) as context:
            LqasDataManager()
        self.assertIn("An Account is required", str(context.exception))

    def test_parse_json_and_create_lqas_activities_success(self):
        """Test successful creation of LQAS activities from JSON data"""
        manager = LqasDataManager(account=self.account)

        with patch.object(manager.logger, "info") as mock_info:
            manager.parse_json_and_create_lqas_activities(self.sample_lqas_data)

        # Verify LQAS round data was created
        round_data = LqasRoundData.objects.filter(round=self.round).first()
        self.assertIsNotNone(round_data)
        self.assertEqual(round_data.lqas_failed, 2)
        self.assertEqual(round_data.lqas_passed, 8)
        self.assertEqual(round_data.lqas_no_data, 0)
        self.assertEqual(round_data.status, LqasStatuses.INSCOPE)

        # Verify NFM stats were created
        self.assertEqual(round_data.nfm_child_absent, 5)
        self.assertEqual(round_data.nfm_other, 2)
        self.assertEqual(round_data.nfm_non_compliance, 1)
        self.assertEqual(round_data.nfm_child_was_asleep, 3)
        self.assertEqual(round_data.nfm_house_not_visited, 0)
        self.assertEqual(round_data.nfm_child_is_a_visitor, 1)
        self.assertEqual(round_data.nfm_vaccinated_but_not_fm, 2)

        # Verify absence stats were created
        self.assertEqual(round_data.abs_farm, 3)
        self.assertEqual(round_data.abs_other, 1)
        self.assertEqual(round_data.abs_market, 2)
        self.assertEqual(round_data.abs_school, 4)
        self.assertEqual(round_data.abs_travelled, 1)
        self.assertEqual(round_data.abs_in_playground, 0)
        self.assertEqual(round_data.abs_unknown, 1)

        # Verify LQAS district data was created
        district_entries = LqasDistrictData.objects.filter(round=self.round)
        self.assertEqual(district_entries.count(), 2)

        # Check first district entry
        entry1 = district_entries.filter(district=self.district1).first()
        self.assertIsNotNone(entry1)
        self.assertEqual(entry1.total_children_fmd, 45)
        self.assertEqual(entry1.total_children_checked, 50)
        self.assertEqual(entry1.total_sites_visited, 10)
        self.assertEqual(entry1.status, LqasStatuses.INSCOPE)

        # Check caregiver stats for first entry
        self.assertEqual(entry1.cg_ratio, 0.9)
        self.assertEqual(entry1.cg_caregivers_informed, 45)
        self.assertEqual(entry1.cg_caregivers_informed_ratio, 0.9)
        self.assertEqual(entry1.cg_best_info_source, "health_worker")
        self.assertEqual(entry1.cg_best_info_ratio, 30)

        # Check second district entry
        entry2 = district_entries.filter(district=self.district2).first()
        self.assertIsNotNone(entry2)
        self.assertEqual(entry2.total_children_fmd, 38)
        self.assertEqual(entry2.total_children_checked, 40)
        self.assertEqual(entry2.total_sites_visited, 8)

        # Verify logging
        mock_info.assert_any_call("Success: 1/1- Test Campaign")

    def test_parse_json_and_create_lqas_activities_with_nonexistent_round(self):
        """Test handling of nonexistent round in JSON data"""
        manager = LqasDataManager(account=self.account)

        # Create data with nonexistent round
        data_with_nonexistent_round = {
            "stats": {
                "Nonexistent Campaign": {
                    "rounds": [
                        {
                            "number": 999,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "data": {},
                        }
                    ]
                }
            }
        }

        with patch.object(manager.logger, "warning") as mock_warning:
            with patch.object(manager.logger, "info") as mock_info:
                manager.parse_json_and_create_lqas_activities(data_with_nonexistent_round)

        # Verify warning was logged
        mock_warning.assert_any_call("Could not add LQAS data for Nonexistent Campaign Round 999: Round not found")
        mock_info.assert_any_call("Success: 0/1- Nonexistent Campaign")
        mock_info.assert_any_call("Failures: 1/1- Nonexistent Campaign")

    def test_parse_json_and_create_lqas_activities_with_nonexistent_district(self):
        """Test handling of nonexistent district in JSON data"""
        manager = LqasDataManager(account=self.account)

        # Create data with nonexistent district
        data_with_nonexistent_district = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "data": {
                                "Nonexistent District": {
                                    "total_child_fmd": 45,
                                    "total_children_checked": 50,
                                    "district": 99999,  # Nonexistent district ID
                                }
                            },
                        }
                    ]
                }
            }
        }

        with patch.object(manager.logger, "warning") as mock_warning:
            with patch.object(manager.logger, "info") as mock_info:
                manager.parse_json_and_create_lqas_activities(data_with_nonexistent_district)

        # Verify warning was logged
        mock_warning.assert_any_call("No district found for Nonexistent District, id:99999 ")
        mock_info.assert_any_call("Success: 1/1- Test Campaign")

    def test_parse_json_and_update_lqas_activities(self):
        """Test updating existing LQAS activities from JSON data"""
        manager = LqasDataManager(account=self.account)

        # First create the data
        manager.parse_json_and_create_lqas_activities(self.sample_lqas_data)

        # Update the data
        updated_data = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 3,  # Updated value
                            "lqas_passed": 7,  # Updated value
                            "lqas_no_data": 1,  # Updated value
                            "status": "inScope",
                            "nfm_stats": {
                                "childabsent": 6,  # Updated value
                                "Other": 2,
                                "Non_Compliance": 1,
                                "Child_was_asleep": 3,
                                "House_not_visited": 0,
                                "Child_is_a_visitor": 1,
                                "Vaccinated_but_not_FM": 2,
                            },
                            "nfm_abs_stats": {
                                "Farm": 4,  # Updated value
                                "Other": 1,
                                "Market": 2,
                                "School": 4,
                                "Travelled": 1,
                                "In_playground": 0,
                                "unknown": 1,
                            },
                            "data": {
                                "Test District 1": {
                                    "total_child_fmd": 46,  # Updated value
                                    "total_child_checked": 50,
                                    "total_sites_visited": 10,
                                    "status": "inScope",
                                    "district": self.district1.id,
                                    "care_giver_stats": {
                                        "ratio": 0.92,  # Updated value
                                        "caregivers_informed": 46,  # Updated value
                                        "caregivers_informed_ratio": 0.92,  # Updated value
                                        "health_worker": 30,
                                        "community_worker": 16,  # Updated value
                                    },
                                },
                            },
                        }
                    ]
                }
            }
        }

        with patch.object(manager.logger, "info") as mock_info:
            manager.parse_json_and_update_lqas_activities(updated_data)

        # Verify LQAS round data was updated
        round_data = LqasRoundData.objects.filter(round=self.round).first()
        self.assertEqual(round_data.lqas_failed, 3)
        self.assertEqual(round_data.lqas_passed, 7)
        self.assertEqual(round_data.lqas_no_data, 1)

        # Verify NFM stats were updated
        self.assertEqual(round_data.nfm_child_absent, 6)

        # Verify absence stats were updated
        self.assertEqual(round_data.abs_farm, 4)

        # Verify LQAS district data was updated
        entry = LqasDistrictData.objects.filter(round=self.round, district=self.district1).first()
        self.assertEqual(entry.total_children_fmd, 46)

        # Verify caregiver stats were updated
        self.assertEqual(entry.cg_ratio, 0.92)
        self.assertEqual(entry.cg_caregivers_informed, 46)
        self.assertEqual(entry.cg_caregivers_informed_ratio, 0.92)
        self.assertEqual(entry.cg_best_info_source, "health_worker")
        self.assertEqual(entry.cg_best_info_ratio, 30)

        # Note: Update method may not log in the same way as create method

    def test_parse_json_with_empty_data(self):
        """Test parsing JSON data with empty or None values"""
        manager = LqasDataManager(account=self.account)

        # Create data with empty/None values
        data_with_empty_values = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": None,
                            "lqas_passed": 0,
                            "lqas_no_data": None,
                            "status": None,
                            "nfm_stats": None,
                            "nfm_abs_stats": None,
                            "data": {},
                        }
                    ]
                }
            }
        }

        manager.parse_json_and_create_lqas_activities(data_with_empty_values)

        # Verify LQAS round data was created with default values
        round_data = LqasRoundData.objects.filter(round=self.round).first()
        self.assertIsNotNone(round_data)
        self.assertEqual(round_data.lqas_failed, 0)
        self.assertEqual(round_data.lqas_passed, 0)
        self.assertEqual(round_data.lqas_no_data, 0)
        self.assertEqual(round_data.status, LqasStatuses.INSCOPE)

        # Verify NFM fields have default values
        self.assertEqual(round_data.nfm_child_absent, 0)
        self.assertEqual(round_data.nfm_other, 0)
        self.assertEqual(round_data.nfm_non_compliance, 0)
        self.assertEqual(round_data.nfm_child_was_asleep, 0)
        self.assertEqual(round_data.nfm_house_not_visited, 0)
        self.assertEqual(round_data.nfm_child_is_a_visitor, 0)
        self.assertEqual(round_data.nfm_vaccinated_but_not_fm, 0)

        # Verify absence fields have default values
        self.assertEqual(round_data.abs_farm, 0)
        self.assertEqual(round_data.abs_other, 0)
        self.assertEqual(round_data.abs_market, 0)
        self.assertEqual(round_data.abs_school, 0)
        self.assertEqual(round_data.abs_travelled, 0)
        self.assertEqual(round_data.abs_in_playground, 0)
        self.assertEqual(round_data.abs_unknown, 0)

    def test_parse_json_with_missing_caregiver_stats(self):
        """Test parsing JSON data without caregiver stats"""
        manager = LqasDataManager(account=self.account)

        # Create data without caregiver stats
        data_without_caregiver_stats = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "data": {
                                "Test District 1": {
                                    "total_child_fmd": 45,
                                    "total_child_checked": 50,
                                    "total_sites_visited": 10,
                                    "district": self.district1.id,
                                    # No care_giver_stats
                                },
                            },
                        }
                    ]
                }
            }
        }

        manager.parse_json_and_create_lqas_activities(data_without_caregiver_stats)

    def test_parse_json_with_invalid_caregiver_stats(self):
        """Test parsing JSON data with invalid caregiver stats structure"""
        manager = LqasDataManager(account=self.account)

        # Create data with invalid caregiver stats (missing required fields)
        data_with_invalid_caregiver_stats = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "data": {
                                "Test District 1": {
                                    "total_child_fmd": 45,
                                    "total_child_checked": 50,
                                    "total_sites_visited": 10,
                                    "district": self.district1.id,
                                    "care_giver_stats": {
                                        # Missing required fields
                                    },
                                },
                            },
                        }
                    ]
                }
            }
        }

        # This should not raise an error but should handle gracefully
        manager.parse_json_and_create_lqas_activities(data_with_invalid_caregiver_stats)

    def test_safe_update_or_create_method(self):
        """Test the _safe_update_or_create method"""
        manager = LqasDataManager(account=self.account)

        # Test creating new instance
        instance = manager._safe_update_or_create(
            model_class=LqasRoundData,
            lookup_kwargs={"round": self.round, "subactivity": None},
            update_values={
                "lqas_failed": 5,
                "lqas_passed": 10,
                "lqas_no_data": 0,
                "status": LqasStatuses.INSCOPE,
                "nfm_child_absent": 0,
                "nfm_other": 0,
                "nfm_non_compliance": 0,
                "nfm_child_was_asleep": 0,
                "nfm_house_not_visited": 0,
                "nfm_child_is_a_visitor": 0,
                "nfm_vaccinated_but_not_fm": 0,
                "abs_farm": 0,
                "abs_other": 0,
                "abs_market": 0,
                "abs_school": 0,
                "abs_travelled": 0,
                "abs_in_playground": 0,
                "abs_unknown": 0,
            },
        )

        self.assertIsNotNone(instance)
        self.assertEqual(instance.lqas_failed, 5)
        self.assertEqual(instance.lqas_passed, 10)
        self.assertEqual(instance.lqas_no_data, 0)
        self.assertEqual(instance.status, LqasStatuses.INSCOPE)

        # Assert NFM (No Finger Mark) fields
        self.assertEqual(instance.nfm_child_absent, 0)
        self.assertEqual(instance.nfm_other, 0)
        self.assertEqual(instance.nfm_non_compliance, 0)
        self.assertEqual(instance.nfm_child_was_asleep, 0)
        self.assertEqual(instance.nfm_house_not_visited, 0)
        self.assertEqual(instance.nfm_child_is_a_visitor, 0)
        self.assertEqual(instance.nfm_vaccinated_but_not_fm, 0)

        # Assert absence fields
        self.assertEqual(instance.abs_farm, 0)
        self.assertEqual(instance.abs_other, 0)
        self.assertEqual(instance.abs_market, 0)
        self.assertEqual(instance.abs_school, 0)
        self.assertEqual(instance.abs_travelled, 0)
        self.assertEqual(instance.abs_in_playground, 0)
        self.assertEqual(instance.abs_unknown, 0)

        # Test updating existing instance
        updated_instance = manager._safe_update_or_create(
            model_class=LqasRoundData,
            lookup_kwargs={"round": self.round, "subactivity": None},
            update_values={
                "lqas_failed": 7,
                "lqas_passed": 8,
                "lqas_no_data": 1,
                "status": LqasStatuses.INSCOPE,
                "nfm_child_absent": 0,
                "nfm_other": 0,
                "nfm_non_compliance": 0,
                "nfm_child_was_asleep": 0,
                "nfm_house_not_visited": 0,
                "nfm_child_is_a_visitor": 0,
                "nfm_vaccinated_but_not_fm": 0,
                "abs_farm": 0,
                "abs_other": 0,
                "abs_market": 0,
                "abs_school": 0,
                "abs_travelled": 0,
                "abs_in_playground": 0,
                "abs_unknown": 0,
            },
        )

        self.assertEqual(updated_instance.lqas_failed, 7)
        self.assertEqual(updated_instance.lqas_passed, 8)
        self.assertEqual(updated_instance.lqas_no_data, 1)
        self.assertEqual(updated_instance.status, LqasStatuses.INSCOPE)

        # Assert NFM (No Finger Mark) fields
        self.assertEqual(updated_instance.nfm_child_absent, 0)
        self.assertEqual(updated_instance.nfm_other, 0)
        self.assertEqual(updated_instance.nfm_non_compliance, 0)
        self.assertEqual(updated_instance.nfm_child_was_asleep, 0)
        self.assertEqual(updated_instance.nfm_house_not_visited, 0)
        self.assertEqual(updated_instance.nfm_child_is_a_visitor, 0)
        self.assertEqual(updated_instance.nfm_vaccinated_but_not_fm, 0)

        # Assert absence fields
        self.assertEqual(updated_instance.abs_farm, 0)
        self.assertEqual(updated_instance.abs_other, 0)
        self.assertEqual(updated_instance.abs_market, 0)
        self.assertEqual(updated_instance.abs_school, 0)
        self.assertEqual(updated_instance.abs_travelled, 0)
        self.assertEqual(updated_instance.abs_in_playground, 0)
        self.assertEqual(updated_instance.abs_unknown, 0)

        # Verify only one instance exists
        self.assertEqual(LqasRoundData.objects.filter(round=self.round, subactivity=None).count(), 1)

    def test_prefetch_rounds_and_districts_method(self):
        """Test the _prefetch_rounds_and_districts method"""
        manager = LqasDataManager(account=self.account)

        rounds, districts = manager._prefetch_rounds_and_districts(self.sample_lqas_data)

        # Verify rounds were fetched
        self.assertIn(self.round, rounds)

        # Verify districts were fetched
        self.assertIn(self.district1, districts)
        self.assertIn(self.district2, districts)

    def test_duplicate_data_handling(self):
        """Test handling of duplicate data (should not create duplicates)"""
        manager = LqasDataManager(account=self.account)

        # Create data twice
        manager.parse_json_and_create_lqas_activities(self.sample_lqas_data)
        manager.parse_json_and_create_lqas_activities(self.sample_lqas_data)

        # Verify only one set of records exists
        self.assertEqual(LqasRoundData.objects.filter(round=self.round).count(), 1)
        self.assertEqual(LqasDistrictData.objects.filter(round=self.round).count(), 2)  # one entry per district

    def test_multiple_campaigns_and_rounds(self):
        """Test handling multiple campaigns and rounds"""
        manager = LqasDataManager(account=self.account)

        # Create second campaign and round
        campaign2 = Campaign.objects.create(
            obr_name="Test Campaign 2",
            account=self.account,
            country=self.country,
        )
        round2 = Round.objects.create(
            campaign=campaign2,
            number=1,
            started_at="2024-02-01",
            ended_at="2024-02-28",
        )

        # Create data with multiple campaigns
        multi_campaign_data = {
            "stats": {
                "Test Campaign": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 2,
                            "lqas_passed": 8,
                            "data": {
                                "Test District 1": {
                                    "total_child_fmd": 45,
                                    "total_child_checked": 50,
                                    "district": self.district1.id,
                                    "care_giver_stats": {
                                        "ratio": 0.9,
                                        "caregivers_informed": 45,
                                        "caregivers_informed_ratio": 0.9,
                                        "health_worker": 30,
                                    },
                                },
                            },
                        }
                    ]
                },
                "Test Campaign 2": {
                    "rounds": [
                        {
                            "number": 1,
                            "lqas_failed": 1,
                            "lqas_passed": 9,
                            "data": {
                                "Test District 2": {
                                    "total_child_fmd": 38,
                                    "total_child_checked": 40,
                                    "district": self.district2.id,
                                    "care_giver_stats": {
                                        "ratio": 0.95,
                                        "caregivers_informed": 38,
                                        "caregivers_informed_ratio": 0.95,
                                        "health_worker": 25,
                                    },
                                },
                            },
                        }
                    ]
                },
            }
        }

        manager.parse_json_and_create_lqas_activities(multi_campaign_data)

        # Verify data was created for both campaigns
        self.assertEqual(LqasRoundData.objects.filter(round=self.round).count(), 1)
        self.assertEqual(LqasRoundData.objects.filter(round=round2).count(), 1)
        self.assertEqual(LqasDistrictData.objects.filter(round=self.round).count(), 1)
        self.assertEqual(LqasDistrictData.objects.filter(round=round2).count(), 1)

        # Verify specific data for first campaign
        round_data1 = LqasRoundData.objects.filter(round=self.round).first()
        self.assertEqual(round_data1.lqas_failed, 2)
        self.assertEqual(round_data1.lqas_passed, 8)

        district_data1 = LqasDistrictData.objects.filter(round=self.round).first()
        self.assertEqual(district_data1.total_children_fmd, 45)
        self.assertEqual(district_data1.total_children_checked, 50)
        self.assertEqual(district_data1.cg_ratio, 0.9)

        # Verify specific data for second campaign
        round_data2 = LqasRoundData.objects.filter(round=round2).first()
        self.assertEqual(round_data2.lqas_failed, 1)
        self.assertEqual(round_data2.lqas_passed, 9)

        district_data2 = LqasDistrictData.objects.filter(round=round2).first()
        self.assertEqual(district_data2.total_children_fmd, 38)
        self.assertEqual(district_data2.total_children_checked, 40)
        self.assertEqual(district_data2.cg_ratio, 0.95)
