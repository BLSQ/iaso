import datetime

import time_machine

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso import models as m
from plugins.polio.api.lqas_im.lqas_im_country_block import LqasCountryBlockFilter
from plugins.polio.models import Campaign, Round, SubActivity
from plugins.polio.models.lqas_im import LqasDistrictData, LqasRoundData, LqasStatuses


TODAY = datetime.datetime(2024, 6, 27, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class LqasCountryBlockFilterTestCase(TestCase):
    """
    Test LqasCountryBlockFilter.
    """

    @classmethod
    def setUpTestData(cls):
        # Create base data
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)

        # Create org unit types and hierarchy
        cls.country_type = m.OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        cls.region_type = m.OrgUnitType.objects.create(name="Region", depth=2, category="REGION")
        cls.district_type = m.OrgUnitType.objects.create(name="District", depth=3, category="DISTRICT")

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
        cls.region1 = m.OrgUnit.objects.create(
            name="Region 1",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country1,
        )
        cls.region2 = m.OrgUnit.objects.create(
            name="Region 2",
            org_unit_type=cls.region_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.country2,
        )
        cls.district1 = m.OrgUnit.objects.create(
            name="District 1",
            org_unit_type=cls.district_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.region1,
        )
        cls.district2 = m.OrgUnit.objects.create(
            name="District 2",
            org_unit_type=cls.district_type,
            validation_status="VALID",
            version=cls.source_version,
            parent=cls.region2,
        )

        # Create campaigns and rounds
        cls.campaign1 = Campaign.objects.create(
            obr_name="Campaign 1",
            account=cls.account,
            country=cls.country1,
        )
        cls.campaign2 = Campaign.objects.create(
            obr_name="Campaign 2",
            account=cls.account,
            country=cls.country2,
        )

        cls.round1 = Round.objects.create(
            campaign=cls.campaign1,
            number=1,
            started_at="2024-01-01",
            ended_at="2024-01-31",
            lqas_ended_at="2024-01-15",
        )
        cls.round2 = Round.objects.create(
            campaign=cls.campaign2,
            number=1,
            started_at="2024-02-01",
            ended_at="2024-02-28",
            lqas_ended_at="2024-02-15",
        )

        # Create subactivities
        cls.subactivity1 = SubActivity.objects.create(
            round=cls.round1,
            name="SubActivity 1",
            end_date="2024-01-10",
            lqas_ended_at="2024-01-08",
        )
        cls.subactivity2 = SubActivity.objects.create(
            round=cls.round2,
            name="SubActivity 2",
            end_date="2024-02-10",
            lqas_ended_at="2024-02-08",
        )

        # Create LQAS data
        cls._create_lqas_data()

    @classmethod
    def _create_lqas_data(cls):
        """Create LQAS test data"""
        # Create LQAS round data for Round 1 (January 2024)
        LqasRoundData.objects.create(
            round=cls.round1,
            subactivity=None,
            lqas_failed=2,
            lqas_passed=8,
            lqas_no_data=0,
            status=LqasStatuses.INSCOPE,
            # NFM (No Finger Mark) fields - all required
            nfm_child_absent=1,
            nfm_other=1,
            nfm_non_compliance=1,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=1,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=1,
            # Absence fields - all required
            abs_farm=1,
            abs_other=1,
            abs_market=1,
            abs_school=1,
            abs_travelled=1,
            abs_in_playground=1,
            abs_unknown=1,
        )
        LqasRoundData.objects.create(
            round=cls.round1,
            subactivity=cls.subactivity1,
            lqas_failed=1,
            lqas_passed=4,
            lqas_no_data=0,
            status=LqasStatuses.INSCOPE,
            # NFM (No Finger Mark) fields - all required
            nfm_child_absent=1,
            nfm_other=1,
            nfm_non_compliance=1,
            nfm_child_was_asleep=1,
            nfm_house_not_visited=1,
            nfm_child_is_a_visitor=1,
            nfm_vaccinated_but_not_fm=1,
            # Absence fields - all required
            abs_farm=1,
            abs_other=1,
            abs_market=1,
            abs_school=1,
            abs_travelled=1,
            abs_in_playground=1,
            abs_unknown=1,
        )

        # Create LQAS round data for Round 2 (February 2024)
        LqasRoundData.objects.create(
            round=cls.round2,
            subactivity=None,
            lqas_failed=3,
            lqas_passed=7,
            lqas_no_data=0,
            status=LqasStatuses.INSCOPE,
            # NFM (No Finger Mark) fields - all required
            nfm_child_absent=2,
            nfm_other=2,
            nfm_non_compliance=2,
            nfm_child_was_asleep=2,
            nfm_house_not_visited=2,
            nfm_child_is_a_visitor=2,
            nfm_vaccinated_but_not_fm=2,
            # Absence fields - all required
            abs_farm=2,
            abs_other=2,
            abs_market=2,
            abs_school=2,
            abs_travelled=2,
            abs_in_playground=2,
            abs_unknown=2,
        )
        LqasRoundData.objects.create(
            round=cls.round2,
            subactivity=cls.subactivity2,
            lqas_failed=2,
            lqas_passed=3,
            lqas_no_data=0,
            status=LqasStatuses.INSCOPE,
            # NFM (No Finger Mark) fields - all required
            nfm_child_absent=2,
            nfm_other=2,
            nfm_non_compliance=2,
            nfm_child_was_asleep=2,
            nfm_house_not_visited=2,
            nfm_child_is_a_visitor=2,
            nfm_vaccinated_but_not_fm=2,
            # Absence fields - all required
            abs_farm=2,
            abs_other=2,
            abs_market=2,
            abs_school=2,
            abs_travelled=2,
            abs_in_playground=2,
            abs_unknown=2,
        )

        # District data for Round 1 (January 2024)
        LqasDistrictData.objects.create(
            round=cls.round1,
            district=cls.district1,
            subactivity=None,
            total_children_fmd=45,
            total_children_checked=50,
            total_sites_visited=10,
            status=LqasStatuses.LQASOK,
        )
        LqasDistrictData.objects.create(
            round=cls.round1,
            district=cls.district1,
            subactivity=cls.subactivity1,
            total_children_fmd=20,
            total_children_checked=25,
            total_sites_visited=5,
            status=LqasStatuses.LQASOK,
        )

        # District data for Round 2 (February 2024)
        LqasDistrictData.objects.create(
            round=cls.round2,
            district=cls.district2,
            subactivity=None,
            total_children_fmd=35,
            total_children_checked=40,
            total_sites_visited=8,
            status=LqasStatuses.LQASOK,
        )
        LqasDistrictData.objects.create(
            round=cls.round2,
            district=cls.district2,
            subactivity=cls.subactivity2,
            total_children_fmd=15,
            total_children_checked=20,
            total_sites_visited=4,
            status=LqasStatuses.LQASOK,
        )

    def test_filter_by_month_january(self):
        """Test filtering by January 2024"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        filtered_queryset = filter_instance.filter_month(queryset, "month", "01-2024")

        # Should return data from Round 1 (January) - only most recent per district
        self.assertEqual(filtered_queryset.count(), 1)
        for item in filtered_queryset:
            self.assertEqual(item.round, self.round1)

    def test_filter_by_month_february(self):
        """Test filtering by February 2024"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        filtered_queryset = filter_instance.filter_month(queryset, "month", "02-2024")

        # Should return data from Round 2 (February) - only most recent per district
        self.assertEqual(filtered_queryset.count(), 1)
        for item in filtered_queryset:
            self.assertEqual(item.round, self.round2)

    def test_filter_by_month_invalid_format(self):
        """Test handling of invalid month format"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        with self.assertRaises(ValidationError):
            filter_instance.filter_month(queryset, "month", "invalid-month")

    def test_filter_by_country_block(self):
        """Test country block filter"""
        # Create a group for country block filtering
        group = m.Group.objects.create(name="Test Country Block", source_version=self.source_version)
        group.org_units.add(self.country1)

        # Test filtering by country block
        filtered_queryset = LqasCountryBlockFilter().filter_country_block(
            LqasDistrictData.objects.all(), "country_block_id", group.id
        )
        results = list(filtered_queryset)

        # Should return data from Country 1 only
        self.assertGreater(len(results), 0)
        for result in results:
            # All districts in Country 1 have parent regions that are children of country1
            self.assertIn(result.district.parent.name, ["Region 1"])

    def test_filter_by_country_block_nonexistent(self):
        """Test country block filter with nonexistent group"""
        # Test filtering by nonexistent country block
        with self.assertRaises(ValidationError):
            LqasCountryBlockFilter().filter_country_block(LqasDistrictData.objects.all(), "country_block_id", 99999)

    def test_filter_combination(self):
        """Test combining month and country block filters"""
        # Create a group for country block filtering
        group = m.Group.objects.create(name="Test Country Block", source_version=self.source_version)
        group.org_units.add(self.country1)

        # Test combination of filters
        month_filtered = LqasCountryBlockFilter().filter_month(LqasDistrictData.objects.all(), "month", "01-2024")
        combined_filtered = LqasCountryBlockFilter().filter_country_block(month_filtered, "country_block_id", group.id)
        results = list(combined_filtered)

        # Should return data from Round 1 (January) in Country 1
        self.assertGreater(len(results), 0)
        for result in results:
            self.assertEqual(result.round.number, 1)
            self.assertIn(result.district.parent.name, ["Region 1"])

    def test_filter_empty_results(self):
        """Test filtering that results in empty set"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Filter for March 2024 (no data exists)
        filtered_queryset = filter_instance.filter_month(queryset, "month", "03-2024")

        # Should return empty queryset
        self.assertEqual(filtered_queryset.count(), 0)

    def test_filter_most_recent_per_district(self):
        """Test that Window function returns most recent entry per district"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Filter by January 2024
        filtered_queryset = filter_instance.filter_month(queryset, "month", "01-2024")

        # Should return only the most recent entry per district
        # In this case, only 1 entry for district1 (the most recent one)
        self.assertEqual(filtered_queryset.count(), 1)

        # Verify that we get only the most recent entry for district1
        district1_entries = filtered_queryset.filter(district=self.district1)
        self.assertEqual(district1_entries.count(), 1)

    def test_filter_date_range_accuracy(self):
        """Test that date filtering is accurate"""
        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Filter by January 2024
        filtered_queryset = filter_instance.filter_month(queryset, "month", "01-2024")

        # All results should have effective dates in January 2024
        for item in filtered_queryset:
            # The effective date should be based on the round's lqas_ended_at or subactivity's lqas_ended_at
            if hasattr(item, "effective_date"):
                self.assertEqual(item.effective_date.month, 1)
                self.assertEqual(item.effective_date.year, 2024)

    def test_filter_with_large_dataset(self):
        """Test filter performance with larger dataset"""
        # Create additional data for performance testing
        additional_districts = []
        for i in range(3, 8):  # Create 5 more districts
            district = m.OrgUnit.objects.create(
                name=f"District {i}",
                org_unit_type=self.district_type,
                validation_status="VALID",
                version=self.source_version,
                parent=self.region1,
            )
            additional_districts.append(district)

        # Create additional LQAS data for these districts
        for district in additional_districts:
            for round_obj in [self.round1, self.round2]:
                LqasDistrictData.objects.create(
                    round=round_obj,
                    district=district,
                    subactivity=None,
                    total_children_fmd=40,
                    total_children_checked=50,
                    total_sites_visited=10,
                    status=LqasStatuses.LQASOK,
                )

        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Test performance with larger dataset
        with self.assertNumQueries(1):  # Should still be a single query
            month_filtered = filter_instance.filter_month(queryset, "month", "01-2024")
            list(month_filtered)  # Force evaluation

        # Test that we get the expected number of results
        self.assertEqual(
            month_filtered.count(), 6
        )  # 1 original + 5 additional districts (only most recent per district)

    def test_filter_window_function_accuracy(self):
        """Test that Window function correctly identifies most recent entries"""
        # Create multiple entries for the same district with different dates
        round3 = Round.objects.create(
            campaign=self.campaign1,
            number=3,
            started_at="2024-03-01",
            ended_at="2024-03-31",
            lqas_ended_at="2024-03-15",
        )

        # Create data for district1 across multiple rounds
        LqasDistrictData.objects.create(
            round=round3,
            district=self.district1,
            subactivity=None,
            total_children_fmd=50,
            total_children_checked=55,
            total_sites_visited=12,
            status=LqasStatuses.LQASOK,
        )

        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Filter by March 2024
        filtered_queryset = filter_instance.filter_month(queryset, "month", "03-2024")

        # Should return only the most recent entry for district1
        district1_entries = filtered_queryset.filter(district=self.district1)
        self.assertEqual(district1_entries.count(), 1)
        self.assertEqual(district1_entries.first().round, round3)

    def test_filter_coalesce_function_accuracy(self):
        """Test that Coalesce function correctly handles different date sources"""
        # Create data with different date scenarios
        round_with_subactivity = Round.objects.create(
            campaign=self.campaign1,
            number=4,
            started_at="2024-04-01",
            ended_at="2024-04-30",
            lqas_ended_at="2024-04-20",  # This should be used
        )

        subactivity = SubActivity.objects.create(
            round=round_with_subactivity,
            name="Test SubActivity",
            end_date="2024-04-10",
            lqas_ended_at="2024-04-08",  # This should be used instead of round's lqas_ended_at
        )

        LqasDistrictData.objects.create(
            round=round_with_subactivity,
            district=self.district1,
            subactivity=subactivity,
            total_children_fmd=30,
            total_children_checked=35,
            total_sites_visited=7,
            status=LqasStatuses.LQASOK,
        )

        queryset = LqasDistrictData.objects.all()
        filter_instance = LqasCountryBlockFilter()

        # Filter by April 2024
        filtered_queryset = filter_instance.filter_month(queryset, "month", "04-2024")

        # Should return the entry with subactivity
        self.assertEqual(filtered_queryset.count(), 1)
        self.assertIsNotNone(filtered_queryset.first().subactivity)
