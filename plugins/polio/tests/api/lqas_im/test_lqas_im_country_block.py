import datetime

import time_machine

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import permissions as polio_permissions
from plugins.polio.models import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasDistrictData, LqasRoundData, LqasStatuses


TODAY = datetime.datetime(2024, 6, 27, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class LqasImCountryBlockViewSetTestCase(APITestCase):
    """
    Test LqasImCountryBlockViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        # Create base data
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)

        # Create users with different permissions
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="john",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[polio_permissions._POLIO],
        )
        cls.admin_user = cls.create_user_with_profile(
            email="admin@polio.org",
            username="admin",
            first_name="Admin",
            last_name="User",
            account=cls.account,
            permissions=[polio_permissions._POLIO_CONFIG],
        )

        # Create org unit types and hierarchy
        cls.country_type = m.OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        cls.region_type = m.OrgUnitType.objects.create(name="Region", depth=2, category="REGION")
        cls.district_type = m.OrgUnitType.objects.create(name="District", depth=3, category="DISTRICT")

        # Create multiple countries for comprehensive testing
        cls.country1 = m.OrgUnit.objects.create(
            name="Country 1",
            org_unit_type=cls.country_type,
            validation_status="VALID",
            version=cls.source_version,
        )
        cls.country2 = m.OrgUnit.objects.create(
            name="Country 2",
            org_unit_type=cls.country_type,
            validation_status="VALID",
            version=cls.source_version,
        )

        # Create multiple regions per country
        cls.region1_1 = m.OrgUnit.objects.create(
            name="Region 1-1",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country1,
        )
        cls.region1_2 = m.OrgUnit.objects.create(
            name="Region 1-2",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country1,
        )
        cls.region2_1 = m.OrgUnit.objects.create(
            name="Region 2-1",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country2,
        )
        cls.region2_2 = m.OrgUnit.objects.create(
            name="Region 2-2",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country2,
        )

        # Create multiple districts per region (20 districts total for performance testing)
        cls.districts = []
        for i in range(1, 6):  # 5 districts per region
            for region in [cls.region1_1, cls.region1_2, cls.region2_1, cls.region2_2]:
                district = m.OrgUnit.objects.create(
                    name=f"District {region.name}-{i}",
                    org_unit_type=cls.district_type,
                    validation_status="VALID",
                    version=cls.source_version,
                    parent=region,
                )
                cls.districts.append(district)

        # Create multiple campaigns
        cls.campaign1 = Campaign.objects.create(
            obr_name="Campaign 1",
            account=cls.account,
            country=cls.country1,
        )
        cls.campaign2 = Campaign.objects.create(
            obr_name="Campaign 2",
            account=cls.account,
            country=cls.country1,
        )
        cls.campaign3 = Campaign.objects.create(
            obr_name="Campaign 3",
            account=cls.account,
            country=cls.country2,
        )
        cls.campaign4 = Campaign.objects.create(
            obr_name="Campaign 4",
            account=cls.account,
            country=cls.country2,
        )

        # Create multiple rounds per campaign
        cls.rounds = []
        for campaign in [cls.campaign1, cls.campaign2, cls.campaign3, cls.campaign4]:
            for round_num in range(1, 4):  # 3 rounds per campaign
                round_obj = Round.objects.create(
                    campaign=campaign,
                    number=round_num,
                    started_at=f"2024-{round_num:02d}-01",
                    ended_at=f"2024-{round_num:02d}-28",
                    lqas_ended_at=f"2024-{round_num:02d}-15",
                )
                cls.rounds.append(round_obj)

        # Create subactivities for some rounds
        cls.subactivities = []
        for round_obj in cls.rounds[:8]:  # Create subactivities for first 8 rounds
            subactivity = SubActivity.objects.create(
                round=round_obj,
                name=f"SubActivity {round_obj.campaign.obr_name} R{round_obj.number}",
                end_date=f"2024-{round_obj.number:02d}-10",
                lqas_ended_at=f"2024-{round_obj.number:02d}-08",
            )
            cls.subactivities.append(subactivity)

        # Create LQAS data
        cls._create_lqas_data()

    @classmethod
    def _create_lqas_data(cls):
        """Create comprehensive LQAS test data with enough records for performance testing"""
        # Create LQAS round data for all rounds
        for round_obj in cls.rounds:
            # Main round data
            LqasRoundData.objects.create(
                round=round_obj,
                subactivity=None,
                lqas_failed=round_obj.number * 2,
                lqas_passed=round_obj.number * 8,
                lqas_no_data=0,
                status=LqasStatuses.INSCOPE,
                # NFM (No Finger Mark) fields - all required
                nfm_child_absent=round_obj.number * 1,
                nfm_other=round_obj.number * 1,
                nfm_non_compliance=round_obj.number * 1,
                nfm_child_was_asleep=round_obj.number * 1,
                nfm_house_not_visited=round_obj.number * 1,
                nfm_child_is_a_visitor=round_obj.number * 1,
                nfm_vaccinated_but_not_fm=round_obj.number * 1,
                # Absence fields - all required
                abs_farm=round_obj.number * 1,
                abs_other=round_obj.number * 1,
                abs_market=round_obj.number * 1,
                abs_school=round_obj.number * 1,
                abs_travelled=round_obj.number * 1,
                abs_in_playground=round_obj.number * 1,
                abs_unknown=round_obj.number * 1,
            )

            # Subactivity data for rounds that have subactivities
            if round_obj in [sa.round for sa in cls.subactivities]:
                subactivity = next(sa for sa in cls.subactivities if sa.round == round_obj)
                LqasRoundData.objects.create(
                    round=round_obj,
                    subactivity=subactivity,
                    lqas_failed=round_obj.number,
                    lqas_passed=round_obj.number * 4,
                    lqas_no_data=0,
                    status=LqasStatuses.INSCOPE,
                    # NFM (No Finger Mark) fields - all required
                    nfm_child_absent=round_obj.number * 1,
                    nfm_other=round_obj.number * 1,
                    nfm_non_compliance=round_obj.number * 1,
                    nfm_child_was_asleep=round_obj.number * 1,
                    nfm_house_not_visited=round_obj.number * 1,
                    nfm_child_is_a_visitor=round_obj.number * 1,
                    nfm_vaccinated_but_not_fm=round_obj.number * 1,
                    # Absence fields - all required
                    abs_farm=round_obj.number * 1,
                    abs_other=round_obj.number * 1,
                    abs_market=round_obj.number * 1,
                    abs_school=round_obj.number * 1,
                    abs_travelled=round_obj.number * 1,
                    abs_in_playground=round_obj.number * 1,
                    abs_unknown=round_obj.number * 1,
                )

        # Create LQAS district data for districts and rounds
        # Only create data if the district belongs to the same country as the campaign
        for district in cls.districts:
            for round_obj in cls.rounds:
                # Only create data if the district belongs to the same country as the campaign
                if district.parent.parent == round_obj.campaign.country:
                    # Main district data (without subactivity)
                    LqasDistrictData.objects.create(
                        round=round_obj,
                        district=district,
                        subactivity=None,
                        total_children_fmd=40 + round_obj.number * 5,
                        total_children_checked=50 + round_obj.number * 5,
                        total_sites_visited=8 + round_obj.number,
                        status=LqasStatuses.LQASOK,
                        cg_ratio=0.85 + (round_obj.number * 0.02),
                        cg_best_info_source="health_worker",
                        cg_best_info_ratio=0.85 + (round_obj.number * 0.02),
                        cg_caregivers_informed=40 + round_obj.number * 5,
                        cg_caregivers_informed_ratio=0.85 + (round_obj.number * 0.02),
                    )

                    # Subactivity data for rounds that have subactivities
                    if round_obj in [sa.round for sa in cls.subactivities]:
                        subactivity = next(sa for sa in cls.subactivities if sa.round == round_obj)
                        LqasDistrictData.objects.create(
                            round=round_obj,
                            district=district,
                            subactivity=subactivity,
                            total_children_fmd=20 + round_obj.number * 3,
                            total_children_checked=25 + round_obj.number * 3,
                            total_sites_visited=4 + round_obj.number,
                            status=LqasStatuses.LQASOK,
                            cg_ratio=0.80 + (round_obj.number * 0.02),
                            cg_best_info_source="community_worker",
                            cg_best_info_ratio=0.80 + (round_obj.number * 0.02),
                            cg_caregivers_informed=20 + round_obj.number * 3,
                            cg_caregivers_informed_ratio=0.80 + (round_obj.number * 0.02),
                        )

    def test_get_without_auth(self):
        """Test API access without authentication"""
        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 401)

    def test_get_without_perm(self):
        """Test API access without proper permissions"""
        self.user.user_permissions.clear()
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 403)

    def test_get_ok(self):
        """Test successful API access"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/lqasim/countryblock/?limit=100&page=1")
        self.assertJSONResponse(response, 200)

        # Verify response structure
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        self.assertIn("has_next", response.data)
        self.assertIn("has_previous", response.data)
        self.assertIn("page", response.data)
        self.assertIn("pages", response.data)
        self.assertIn("limit", response.data)

    def test_response_fields(self):
        """Test that all expected fields are present in response"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 200)

        if response.data["results"]:
            result = response.data["results"][0]
            expected_fields = [
                "id",
                "total_children_fmd",
                "total_children_checked",
                "total_sites_visited",
                "status",
                "district_id",
                "district_name",
                "region_id",
                "region_name",
                "round_id",
                "round_number",
                "obr_name",
            ]
            for field in expected_fields:
                self.assertIn(field, result)

    def test_filter_by_month(self):
        """Test filtering by month"""
        self.client.force_authenticate(self.user)

        # Test January 2024 filter
        response = self.client.get("/api/polio/lqasim/countryblock/?month=01-2024")
        self.assertJSONResponse(response, 200)

        # Should return data from Round 1 (January) only
        results = response.data["results"]
        for result in results:
            self.assertEqual(result["round_number"], 1)

    def test_filter_by_country_block(self):
        """Test filtering by country block"""
        self.client.force_authenticate(self.user)

        # Create a group for country block filtering
        group = m.Group.objects.create(name="Test Country Block", source_version=self.source_version)
        group.org_units.add(self.country1)

        response = self.client.get(f"/api/polio/lqasim/countryblock/?country_block_id={group.id}")
        self.assertJSONResponse(response, 200)

        # Should return data from Country 1 only
        results = response.data["results"]
        for result in results:
            # All districts in Country 1 have parent regions that are children of country1
            self.assertIn(result["region_name"], ["Region 1-1", "Region 1-2"])

    def test_filter_combination(self):
        """Test combining multiple filters"""
        self.client.force_authenticate(self.user)

        # Create a group for country block filtering
        group = m.Group.objects.create(name="Test Country Block", source_version=self.source_version)
        group.org_units.add(self.country1)

        # Test combination of month and country block filters
        response = self.client.get(f"/api/polio/lqasim/countryblock/?month=01-2024&country_block_id={group.id}")
        self.assertJSONResponse(response, 200)

        # Should return data from Round 1 (January) in Country 1
        results = response.data["results"]
        for result in results:
            self.assertEqual(result["round_number"], 1)
            self.assertIn(result["region_name"], ["Region 1-1", "Region 1-2"])

    def test_pagination(self):
        """Test pagination functionality"""
        self.client.force_authenticate(self.user)

        # Test with limit
        response = self.client.get("/api/polio/lqasim/countryblock/?limit=2")
        self.assertJSONResponse(response, 200)
        self.assertLessEqual(len(response.data["results"]), 2)

        # Test pagination
        response = self.client.get("/api/polio/lqasim/countryblock/?page=1&limit=2")
        self.assertJSONResponse(response, 200)
        self.assertIn("has_next", response.data)
        self.assertIn("has_previous", response.data)

    def test_invalid_month_filter(self):
        """Test handling of invalid month filter"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/polio/lqasim/countryblock/?month=invalid-month")
        self.assertJSONResponse(response, 400)
        self.assertIn("month", response.data)

    def test_invalid_country_block_filter(self):
        """Test handling of invalid country block filter"""
        self.client.force_authenticate(self.user)
        country_block_id = "99999"
        response = self.client.get(f"/api/polio/lqasim/countryblock/?country_block_id={country_block_id}")
        self.assertJSONResponse(response, 400)
        self.assertIn(country_block_id, response.data[0])

    def test_empty_results(self):
        """Test handling of empty result sets"""
        self.client.force_authenticate(self.user)

        # Test with non-existent month
        response = self.client.get("/api/polio/lqasim/countryblock/?month=12-2025&limit=10&page=1")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["results"]), 0)

    def test_data_integrity(self):
        """Test that returned data is consistent and accurate"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 200)

        for result in response.data["results"]:
            # Test that required fields are present and have valid types
            self.assertIsInstance(result["id"], int)
            self.assertIsInstance(result["total_children_fmd"], int)
            self.assertIsInstance(result["total_children_checked"], int)
            self.assertIsInstance(result["total_sites_visited"], int)
            self.assertIsInstance(result["status"], str)
            self.assertIsInstance(result["district_id"], int)
            self.assertIsInstance(result["district_name"], str)
            self.assertIsInstance(result["region_id"], int)
            self.assertIsInstance(result["region_name"], str)
            self.assertIsInstance(result["round_id"], int)
            self.assertIsInstance(result["round_number"], int)
            self.assertIsInstance(result["obr_name"], str)

            # Test logical constraints
            self.assertGreaterEqual(result["total_children_fmd"], 0)
            self.assertGreaterEqual(result["total_children_checked"], result["total_children_fmd"])
            self.assertGreaterEqual(result["total_sites_visited"], 0)
            self.assertIn(result["status"], [choice[0] for choice in LqasStatuses.choices])

    def test_admin_user_access(self):
        """Test that admin users can access the API"""
        self.client.force_authenticate(self.admin_user)
        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 200)

    def test_user_account_isolation(self):
        """Test that users can only see data from their account"""
        # Create another account with similar data
        other_account = m.Account.objects.create(name="Other Account", default_version=self.source_version)
        other_user = self.create_user_with_profile(
            email="other@polio.org",
            username="other",
            first_name="Other",
            last_name="User",
            account=other_account,
            permissions=[polio_permissions._POLIO],
        )

        # Create similar data for other account
        other_campaign = Campaign.objects.create(
            obr_name="Other Campaign",
            account=other_account,
            country=self.country1,
        )
        other_round = Round.objects.create(
            campaign=other_campaign,
            number=1,
            started_at="2024-01-01",
            ended_at="2024-01-31",
            lqas_ended_at="2024-01-15",
        )
        LqasDistrictData.objects.create(
            round=other_round,
            district=self.districts[0],
            total_children_fmd=50,
            total_children_checked=50,
            total_sites_visited=10,
            status=LqasStatuses.LQASOK,
        )

        # Test that user can't see other account's data
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/lqasim/countryblock/")
        self.assertJSONResponse(response, 200)

        # Verify no data from other account is present
        for result in response.data["results"]:
            self.assertNotEqual(result["obr_name"], "Other Campaign")

    def test_response_actual_values(self):
        """Test that response contains expected actual values from test data"""
        self.client.force_authenticate(self.user)

        # Test unfiltered response values
        response = self.client.get("/api/polio/lqasim/countryblock/?limit=1000&page=1")
        self.assertJSONResponse(response, 200)

        results = response.data["results"]
        self.assertGreater(len(results), 0, "Should have some results")

        # Check that we have data from both countries
        country1_regions = {"Region 1-1", "Region 1-2"}
        country2_regions = {"Region 2-1", "Region 2-2"}
        found_regions = {result["region_name"] for result in results}

        # Should have data from both countries
        self.assertTrue(
            found_regions.intersection(country1_regions), f"Expected data from Country 1 regions, got: {found_regions}"
        )
        self.assertTrue(
            found_regions.intersection(country2_regions), f"Expected data from Country 2 regions, got: {found_regions}"
        )

        # Check specific campaign names
        expected_campaigns = {"Campaign 1", "Campaign 2", "Campaign 3", "Campaign 4"}
        found_campaigns = {result["obr_name"] for result in results}
        self.assertTrue(
            found_campaigns.intersection(expected_campaigns), f"Expected campaign names, got: {found_campaigns}"
        )

        # Check round numbers (should be 1, 2, or 3)
        found_rounds = {result["round_number"] for result in results}
        expected_rounds = {1, 2, 3}
        self.assertTrue(found_rounds.intersection(expected_rounds), f"Expected round numbers, got: {found_rounds}")

        # Check district names follow expected pattern
        for result in results:
            district_name = result["district_name"]
            self.assertTrue(
                district_name.startswith("District ")
                and any(region in district_name for region in ["Region 1-1", "Region 1-2", "Region 2-1", "Region 2-2"]),
                f"District name '{district_name}' doesn't follow expected pattern",
            )

        # Check data ranges (based on test data creation logic)
        # Note: There are two types of data - main district data and subactivity data
        for result in results:
            # Main district data: total_children_fmd = 40 + round_obj.number * 5
            # Subactivity data: total_children_fmd = 20 + round_obj.number * 3
            expected_min_fmd = 20 + 1 * 3  # Round 1 subactivity minimum
            expected_max_fmd = 40 + 3 * 5  # Round 3 main district maximum
            self.assertGreaterEqual(result["total_children_fmd"], expected_min_fmd)
            self.assertLessEqual(result["total_children_fmd"], expected_max_fmd)

            # Main district data: total_children_checked = 50 + round_obj.number * 5
            # Subactivity data: total_children_checked = 25 + round_obj.number * 3
            expected_min_checked = 25 + 1 * 3  # Round 1 subactivity minimum
            expected_max_checked = 50 + 3 * 5  # Round 3 main district maximum
            self.assertGreaterEqual(result["total_children_checked"], expected_min_checked)
            self.assertLessEqual(result["total_children_checked"], expected_max_checked)

            # Main district data: total_sites_visited = 8 + round_obj.number
            # Subactivity data: total_sites_visited = 4 + round_obj.number
            expected_min_sites = 4 + 1  # Round 1 subactivity minimum
            expected_max_sites = 8 + 3  # Round 3 main district maximum
            self.assertGreaterEqual(result["total_sites_visited"], expected_min_sites)
            self.assertLessEqual(result["total_sites_visited"], expected_max_sites)

        # Test exact values for specific rounds
        # Find Round 1 data (minimum values) - could be main district or subactivity data
        round1_results = [r for r in results if r["round_number"] == 1]
        if round1_results:
            round1_result = round1_results[0]
            # Round 1 could be either:
            # Main district: total_children_fmd = 40 + 1 * 5 = 45
            # Subactivity: total_children_fmd = 20 + 1 * 3 = 23
            self.assertIn(
                round1_result["total_children_fmd"],
                [23, 45],
                f"Round 1 should have either 23 (subactivity) or 45 (main district) finger marked children, got: {round1_result['total_children_fmd']}",
            )
            # Round 1 could be either:
            # Main district: total_children_checked = 50 + 1 * 5 = 55
            # Subactivity: total_children_checked = 25 + 1 * 3 = 28
            self.assertIn(
                round1_result["total_children_checked"],
                [28, 55],
                f"Round 1 should have either 28 (subactivity) or 55 (main district) checked children, got: {round1_result['total_children_checked']}",
            )
            # Round 1 could be either:
            # Main district: total_sites_visited = 8 + 1 = 9
            # Subactivity: total_sites_visited = 4 + 1 = 5
            self.assertIn(
                round1_result["total_sites_visited"],
                [5, 9],
                f"Round 1 should have either 5 (subactivity) or 9 (main district) sites visited, got: {round1_result['total_sites_visited']}",
            )

        # Find Round 3 data (maximum values) - could be main district or subactivity data
        round3_results = [r for r in results if r["round_number"] == 3]
        if round3_results:
            round3_result = round3_results[0]
            # Round 3 could be either:
            # Main district: total_children_fmd = 40 + 3 * 5 = 55
            # Subactivity: total_children_fmd = 20 + 3 * 3 = 29
            self.assertIn(
                round3_result["total_children_fmd"],
                [29, 55],
                f"Round 3 should have either 29 (subactivity) or 55 (main district) finger marked children, got: {round3_result['total_children_fmd']}",
            )
            # Round 3 could be either:
            # Main district: total_children_checked = 50 + 3 * 5 = 65
            # Subactivity: total_children_checked = 25 + 3 * 3 = 34
            self.assertIn(
                round3_result["total_children_checked"],
                [34, 65],
                f"Round 3 should have either 34 (subactivity) or 65 (main district) checked children, got: {round3_result['total_children_checked']}",
            )
            # Round 3 could be either:
            # Main district: total_sites_visited = 8 + 3 = 11
            # Subactivity: total_sites_visited = 4 + 3 = 7
            self.assertIn(
                round3_result["total_sites_visited"],
                [7, 11],
                f"Round 3 should have either 7 (subactivity) or 11 (main district) sites visited, got: {round3_result['total_sites_visited']}",
            )

        # Test filtered response values
        # Test country block filter
        group = m.Group.objects.create(name="Test Country Block", source_version=self.source_version)
        group.org_units.add(self.country1)

        response = self.client.get(f"/api/polio/lqasim/countryblock/?country_block_id={group.id}&limit=50")
        self.assertJSONResponse(response, 200)

        filtered_results = response.data["results"]
        self.assertGreater(len(filtered_results), 0, "Should have filtered results")

        # All results should be from Country 1 only
        for result in filtered_results:
            self.assertIn(
                result["region_name"],
                country1_regions,
                f"Filtered result should only contain Country 1 regions, got: {result['region_name']}",
            )
            self.assertIn(
                result["obr_name"],
                {"Campaign 1", "Campaign 2"},
                f"Filtered result should only contain Country 1 campaigns, got: {result['obr_name']}",
            )

        # Test month filter
        response = self.client.get("/api/polio/lqasim/countryblock/?month=01-2024&limit=50")
        self.assertJSONResponse(response, 200)

        month_filtered_results = response.data["results"]
        self.assertGreater(len(month_filtered_results), 0, "Should have month filtered results")

        # All results should be from Round 1 (January 2024)
        for result in month_filtered_results:
            self.assertEqual(
                result["round_number"],
                1,
                f"Month filtered result should be from Round 1, got: {result['round_number']}",
            )

        # Test combined filters
        response = self.client.get(
            f"/api/polio/lqasim/countryblock/?month=01-2024&country_block_id={group.id}&limit=50"
        )
        self.assertJSONResponse(response, 200)

        combined_results = response.data["results"]
        self.assertGreater(len(combined_results), 0, "Should have combined filtered results")

        # All results should be from Round 1 AND Country 1
        for result in combined_results:
            self.assertEqual(
                result["round_number"],
                1,
                f"Combined filtered result should be from Round 1, got: {result['round_number']}",
            )
            self.assertIn(
                result["region_name"],
                country1_regions,
                f"Combined filtered result should only contain Country 1 regions, got: {result['region_name']}",
            )
            self.assertIn(
                result["obr_name"],
                {"Campaign 1", "Campaign 2"},
                f"Combined filtered result should only contain Country 1 campaigns, got: {result['obr_name']}",
            )

        # Test data consistency - same record should have consistent values
        if combined_results:
            sample_result = combined_results[0]

            # Check that district and region relationships are consistent
            self.assertIsInstance(sample_result["district_id"], int)
            self.assertIsInstance(sample_result["region_id"], int)
            self.assertIsInstance(sample_result["round_id"], int)

            # Check that string fields are not empty
            self.assertGreater(len(sample_result["district_name"]), 0)
            self.assertGreater(len(sample_result["region_name"]), 0)
            self.assertGreater(len(sample_result["obr_name"]), 0)

            # Check that numeric fields are within reasonable ranges
            self.assertGreater(sample_result["total_children_fmd"], 0)
            self.assertGreater(sample_result["total_children_checked"], 0)
            self.assertGreater(sample_result["total_sites_visited"], 0)

            # Check that checked children >= finger marked children
            self.assertGreaterEqual(sample_result["total_children_checked"], sample_result["total_children_fmd"])
