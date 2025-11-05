from unittest.mock import patch

from django.db import IntegrityError
from django.test import TestCase

from iaso.models import OrgUnit, OrgUnitType
from iaso.test import TestCase
from plugins.polio.models import VACCINES, Campaign, CampaignType
from plugins.polio.permissions import POLIO_BUDGET_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


class CampaignTestCase(TestCase, PolioTestCaseMixin):
    """
    Test Campaign model.
    """

    @classmethod
    def setUpTestData(cls):
        # vaccines
        cls.mopv2 = VACCINES[0][0]
        cls.nopv2 = VACCINES[1][0]
        cls.bopv = VACCINES[2][0]
        cls.nopv2_bopv = VACCINES[3][0]
        # User.
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data Source", account_name="Account", project_name="Project"
        )
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[POLIO_BUDGET_PERMISSION],
        )
        # Org unit types
        cls.org_unit_type_country = cls.create_org_unit_type(name="COUNTRY", projects=[cls.project])
        cls.org_unit_type_district = cls.create_org_unit_type(name="DISTRICT", projects=[cls.project])

        # Campaigns types.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.measles_type = CampaignType.objects.get(name=CampaignType.MEASLES)

        # Polio Campaigns.
        # Campaign 1: separate_scopes_per_round=False, no subactivities
        (
            cls.polio_campaign,
            cls.polio_round_1,
            cls.polio_round_2,
            cls.polio_round_3,
            cls.country,
            cls.district,
        ) = cls.create_campaign(
            obr_name="Polio",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.org_unit_type_country,
            district_ou_type=cls.org_unit_type_district,
        )

        cls.polio_campaign.campaign_types.set([cls.polio_type])

        # Campaign 2: separate_scopes_per_rounds=True, no subactivities
        (
            cls.polio_campaign2,
            cls.polio2_round_1,
            cls.polio2_round_2,
            cls.polio2_round_3,
            cls.country2,
            cls.country2_district,
        ) = cls.create_campaign(
            obr_name="Polio2",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.org_unit_type_country,
            district_ou_type=cls.org_unit_type_district,
            country_name="COUNTRY2",
            district_name="COUNTRY2_DISTRICT1",
        )

        cls.polio_campaign2.campaign_types.set([cls.polio_type])

        # Switch campaign 2 to separate scopes per round to test model methods
        cls.polio_campaign2.separate_scopes_per_round = True
        cls.polio_campaign2.save()

        # Add districts to country 2, to be able to have different round scopes
        cls.country2_district2 = cls.create_valid_org_unit(
            type=cls.org_unit_type_district,
            version=cls.source_version,
            name="COUNTRY2_DISTRICT2",
        )
        cls.country2_district3 = cls.create_valid_org_unit(
            type=cls.org_unit_type_district,
            version=cls.source_version,
            name="COUNTRY2_DISTRICT3",
        )
        cls.country2_district4 = cls.create_valid_org_unit(
            type=cls.org_unit_type_district,
            version=cls.source_version,
            name="COUNTRY2_DISTRICT4",
        )
        cls.country2_district5 = cls.create_valid_org_unit(
            type=cls.org_unit_type_district,
            version=cls.source_version,
            name="COUNTRY2_DISTRICT5",
        )

        # Add round scopes to campaign 2
        cls.add_scope_to_round(
            rnd=cls.polio2_round_1,
            vaccine=cls.mopv2,
            org_units=[cls.country2_district],
            source_version=cls.source_version,
        )
        cls.add_scope_to_round(
            rnd=cls.polio2_round_2,
            vaccine=cls.nopv2_bopv,
            org_units=[cls.country2_district2, cls.country2_district3],
            source_version=cls.source_version,
        )

        # Campaign 3: separate_scopes_per_round=False, with subactivities
        (
            cls.polio_campaign3,
            cls.polio3_round_1,
            cls.polio3_round_2,
            cls.polio3_round_3,
            _,
            _,
        ) = cls.create_campaign(
            obr_name="Polio3",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.org_unit_type_country,
            district_ou_type=cls.org_unit_type_district,
        )
        cls.polio_campaign3.campaign_types.set([cls.polio_type])
        # Change country to country 2 so we can reuse the districts
        cls.polio_campaign3.initial_org_unit = cls.country2
        cls.polio_campaign3.save()

        # Replace default scope with larger scope, so we can have different scopes for subactivities
        cls.replace_campaign_scope(
            campaign=cls.polio_campaign3,
            org_units=[cls.country2_district, cls.country2_district2, cls.country2_district3],
            source_version=cls.source_version,
            vaccine=cls.mopv2,
        )

        # Add subactivities
        cls.polio3_round_1_sub_activity1 = cls.create_sub_activity(
            rnd=cls.polio3_round_1,
            name="rnd1_activity1",
            start_date=cls.polio3_round_1.started_at,
            end_date=cls.polio3_round_1.ended_at,
        )
        cls.add_sub_activity_scope(
            sub_activity=cls.polio3_round_1_sub_activity1,
            org_units=[cls.country2_district],
            vaccine=cls.nopv2_bopv,
            source_version=cls.source_version,
        )
        cls.polio3_round_2_sub_activity1 = cls.create_sub_activity(
            rnd=cls.polio3_round_2,
            name="rnd2_activity1",
            start_date=cls.polio3_round_2.started_at,
            end_date=cls.polio3_round_2.ended_at,
        )
        cls.add_sub_activity_scope(
            sub_activity=cls.polio3_round_2_sub_activity1,
            org_units=[cls.country2_district2],
            vaccine=cls.bopv,
            source_version=cls.source_version,
        )

        # Campaign 4: separate scopes per round and subactivities
        (
            cls.polio_campaign4,
            cls.polio4_round_1,
            cls.polio4_round_2,
            cls.polio4_round_3,
            _,
            _,
        ) = cls.create_campaign(
            obr_name="Polio4",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.org_unit_type_country,
            district_ou_type=cls.org_unit_type_district,
        )
        cls.polio_campaign4.campaign_types.set([cls.polio_type])
        # switch to round scopes
        cls.polio_campaign4.separate_scopes_per_round = True
        # Change country to country 2 so we can reuse the districts
        cls.polio_campaign4.initial_org_unit = cls.country2
        cls.polio_campaign4.save()

        # Add round scopes to campaign 4
        cls.add_scope_to_round(
            rnd=cls.polio4_round_1,
            vaccine=cls.mopv2,
            org_units=[cls.country2_district],
            source_version=cls.source_version,
        )
        cls.add_scope_to_round(
            rnd=cls.polio4_round_2,
            vaccine=cls.bopv,
            org_units=[cls.country2_district2, cls.country2_district3],
            source_version=cls.source_version,
        )

        # Add subactivities
        cls.polio4_round_1_sub_activity1 = cls.create_sub_activity(
            rnd=cls.polio4_round_1,
            name="rnd1_activity1",
            start_date=cls.polio4_round_1.started_at,
            end_date=cls.polio4_round_1.ended_at,
        )
        cls.add_sub_activity_scope(
            sub_activity=cls.polio4_round_1_sub_activity1,
            org_units=[cls.country2_district],
            vaccine=cls.nopv2_bopv,
            source_version=cls.source_version,
        )
        cls.polio4_round_2_sub_activity1 = cls.create_sub_activity(
            rnd=cls.polio4_round_2,
            name="rnd2_activity1",
            start_date=cls.polio4_round_2.started_at,
            end_date=cls.polio4_round_2.ended_at,
        )
        cls.add_sub_activity_scope(
            sub_activity=cls.polio4_round_2_sub_activity1,
            org_units=[cls.country2_district2],
            vaccine=cls.mopv2,
            source_version=cls.source_version,
        )

        # Non polio campaigns
        cls.measles_campaign = Campaign.objects.create(obr_name="Measles", account=cls.account)
        cls.measles_campaign.campaign_types.set([cls.measles_type])

    def test_polio_campaign_manager(self):
        self.assertEqual(Campaign.objects.count(), 5)
        self.assertEqual(Campaign.polio_objects.count(), 4)

        polio_campaign = Campaign.polio_objects.first()
        self.assertEqual(polio_campaign.campaign_types.first().name, CampaignType.POLIO)

    def test_has_polio_type(self):
        self.assertTrue(Campaign.polio_objects.first().has_polio_type)
        self.assertFalse(self.measles_campaign.has_polio_type)

    def test_vaccine_properties_with_separate_scopes_per_round(self):
        # strings
        self.assertEqual(self.polio_campaign2.vaccines, f"{self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio_campaign2.vaccines_extended, f"{self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio_campaign2.vaccines_full, f"{self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio_campaign2.single_vaccines_extended, f"{self.bopv}, {self.mopv2}, {self.nopv2}")
        # lists
        self.assertEqual(self.polio_campaign2.campaign_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign2.round_level_vaccines_list, [self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign2.sub_activity_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign2.vaccines_extended_list, [self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign2.vaccines_full_list, [self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign2.single_vaccines_extended_list, [self.bopv, self.mopv2, self.nopv2])
        self.assertEqual(self.polio_campaign2.single_vaccines_full_list, [self.bopv, self.mopv2, self.nopv2])

    def test_vaccine_properties_campaign_scope(self):
        # strings
        self.assertEqual(self.polio_campaign.vaccines, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign.vaccines_extended, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign.vaccines_full, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign.single_vaccines_extended, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign.single_vaccines_full, f"{self.mopv2}")
        # lists
        self.assertEqual(self.polio_campaign.campaign_level_vaccines_list, [self.mopv2])
        self.assertEqual(self.polio_campaign.round_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign.sub_activity_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign.vaccines_extended_list, [self.mopv2])
        self.assertEqual(self.polio_campaign.single_vaccines_extended_list, [self.mopv2])
        self.assertEqual(self.polio_campaign.vaccines_full_list, [self.mopv2])
        self.assertEqual(self.polio_campaign.single_vaccines_full_list, [self.mopv2])

    def test_vaccine_properties_campaign_scope_with_sub_activities(self):
        # strings
        self.assertEqual(self.polio_campaign3.vaccines, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign3.vaccines_extended, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign3.vaccines_full, f"{self.bopv}, {self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio_campaign3.single_vaccines_extended, f"{self.mopv2}")
        self.assertEqual(self.polio_campaign3.single_vaccines_full, f"{self.bopv}, {self.mopv2}, {self.nopv2}")
        # lists
        self.assertEqual(self.polio_campaign3.campaign_level_vaccines_list, [self.mopv2])
        self.assertEqual(self.polio_campaign3.round_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign3.sub_activity_level_vaccines_list, [self.bopv, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign3.vaccines_extended_list, [self.mopv2])
        self.assertEqual(self.polio_campaign3.single_vaccines_extended_list, [self.mopv2])
        self.assertEqual(self.polio_campaign3.vaccines_full_list, [self.bopv, self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign3.single_vaccines_full_list, [self.bopv, self.mopv2, self.nopv2])

    def test_vaccine_properties_with_separate_scopes_per_round_with_subactivities(self):
        # strings
        self.assertEqual(self.polio_campaign4.vaccines, f"{self.bopv}, {self.mopv2}")
        self.assertEqual(self.polio_campaign4.vaccines_extended, f"{self.bopv}, {self.mopv2}")
        self.assertEqual(self.polio_campaign4.vaccines_full, f"{self.bopv}, {self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio_campaign2.single_vaccines_extended, f"{self.bopv}, {self.mopv2}, {self.nopv2}")
        # lists
        self.assertEqual(self.polio_campaign4.campaign_level_vaccines_list, [])
        self.assertEqual(self.polio_campaign4.round_level_vaccines_list, [self.bopv, self.mopv2])
        self.assertEqual(self.polio_campaign4.sub_activity_level_vaccines_list, [self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign4.vaccines_extended_list, [self.bopv, self.mopv2])
        self.assertEqual(self.polio_campaign4.vaccines_full_list, [self.bopv, self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio_campaign4.single_vaccines_extended_list, [self.bopv, self.mopv2])
        self.assertEqual(self.polio_campaign4.single_vaccines_full_list, [self.bopv, self.mopv2, self.nopv2])

    def test_round_vaccine_properties_no_subactivities(self):
        # strings
        self.assertEqual(self.polio2_round_1.vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio2_round_1.single_vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio2_round_1.vaccine_names_extended, f"{self.mopv2}")
        self.assertEqual(self.polio2_round_1.single_vaccine_names_extended, f"{self.mopv2}")
        self.assertEqual(self.polio2_round_1.subactivities_vaccine_names, "")
        self.assertEqual(self.polio2_round_1.subactivities_single_vaccine_names, "")

        self.assertEqual(self.polio2_round_2.vaccine_names, f"{self.nopv2_bopv}")
        self.assertEqual(self.polio2_round_2.single_vaccine_names, f"{self.bopv}, {self.nopv2}")
        self.assertEqual(self.polio2_round_2.vaccine_names_extended, f"{self.nopv2_bopv}")
        self.assertEqual(self.polio2_round_2.single_vaccine_names_extended, f"{self.bopv}, {self.nopv2}")
        self.assertEqual(self.polio2_round_2.subactivities_vaccine_names, "")
        self.assertEqual(self.polio2_round_2.subactivities_single_vaccine_names, "")

        # lists
        self.assertEqual(self.polio2_round_1.vaccine_list, [self.mopv2])
        self.assertEqual(self.polio2_round_1.single_vaccine_list, [self.mopv2])
        self.assertEqual(self.polio2_round_1.vaccine_list_extended, [self.mopv2])
        self.assertEqual(self.polio2_round_1.single_vaccine_list_extended, [self.mopv2])
        self.assertEqual(self.polio2_round_1.subactivities_vaccine_list, [])
        self.assertEqual(self.polio2_round_1.subactivities_single_vaccine_list, [])

        self.assertEqual(self.polio2_round_2.vaccine_list, [self.nopv2_bopv])
        self.assertEqual(self.polio2_round_2.single_vaccine_list, [self.bopv, self.nopv2])
        self.assertEqual(self.polio2_round_2.vaccine_list_extended, [self.nopv2_bopv])
        self.assertEqual(self.polio2_round_2.single_vaccine_list_extended, [self.bopv, self.nopv2])
        self.assertEqual(self.polio2_round_2.subactivities_vaccine_list, [])
        self.assertEqual(self.polio2_round_2.subactivities_single_vaccine_list, [])

    def test_round_vaccine_properties_with_subactivities(self):
        # strings
        self.assertEqual(self.polio4_round_1.vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio4_round_1.single_vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio4_round_1.vaccine_names_extended, f"{self.mopv2}, {self.nopv2_bopv}")
        self.assertEqual(self.polio4_round_1.single_vaccine_names_extended, f"{self.bopv}, {self.mopv2}, {self.nopv2}")
        self.assertEqual(self.polio4_round_1.subactivities_vaccine_names, f"{self.nopv2_bopv}")
        self.assertEqual(self.polio4_round_1.subactivities_single_vaccine_names, f"{self.bopv}, {self.nopv2}")

        self.assertEqual(self.polio4_round_2.vaccine_names, f"{self.bopv}")
        self.assertEqual(self.polio4_round_2.single_vaccine_names, f"{self.bopv}")
        self.assertEqual(self.polio4_round_2.vaccine_names_extended, f"{self.bopv}, {self.mopv2}")
        self.assertEqual(self.polio4_round_2.single_vaccine_names_extended, f"{self.bopv}, {self.mopv2}")
        self.assertEqual(self.polio4_round_2.subactivities_vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio4_round_2.subactivities_single_vaccine_names, f"{self.mopv2}")

        # lists
        self.assertEqual(self.polio4_round_1.vaccine_list, [self.mopv2])
        self.assertEqual(self.polio4_round_1.single_vaccine_list, [self.mopv2])
        self.assertEqual(self.polio4_round_1.vaccine_list_extended, [self.mopv2, self.nopv2_bopv])
        self.assertEqual(self.polio4_round_1.single_vaccine_list_extended, [self.bopv, self.mopv2, self.nopv2])
        self.assertEqual(self.polio4_round_1.subactivities_vaccine_list, [self.nopv2_bopv])
        self.assertEqual(self.polio4_round_1.subactivities_single_vaccine_list, [self.bopv, self.nopv2])

        self.assertEqual(self.polio4_round_2.vaccine_list, [self.bopv])
        self.assertEqual(self.polio4_round_2.single_vaccine_list, [self.bopv])
        self.assertEqual(self.polio4_round_2.vaccine_list_extended, [self.bopv, self.mopv2])
        self.assertEqual(self.polio4_round_2.single_vaccine_list_extended, [self.bopv, self.mopv2])
        self.assertEqual(self.polio4_round_2.subactivities_vaccine_list, [self.mopv2])
        self.assertEqual(self.polio4_round_2.subactivities_single_vaccine_list, [self.mopv2])

    def test_subactivities_properties(self):
        self.assertEqual(self.polio3_round_1_sub_activity1.vaccine_names, f"{self.nopv2_bopv}")
        self.assertEqual(self.polio3_round_1_sub_activity1.vaccine_list, [self.nopv2_bopv])
        self.assertEqual(self.polio3_round_1_sub_activity1.single_vaccine_names, f"{self.bopv}, {self.nopv2}")
        self.assertEqual(self.polio3_round_1_sub_activity1.single_vaccine_list, [self.bopv, self.nopv2])

        self.assertEqual(self.polio3_round_2_sub_activity1.vaccine_names, f"{self.bopv}")
        self.assertEqual(self.polio3_round_2_sub_activity1.vaccine_list, [self.bopv])
        self.assertEqual(self.polio3_round_2_sub_activity1.single_vaccine_names, f"{self.bopv}")
        self.assertEqual(self.polio3_round_2_sub_activity1.single_vaccine_list, [self.bopv])

        self.assertEqual(self.polio4_round_1_sub_activity1.vaccine_names, f"{self.nopv2_bopv}")
        self.assertEqual(self.polio4_round_1_sub_activity1.vaccine_list, [self.nopv2_bopv])
        self.assertEqual(self.polio4_round_1_sub_activity1.single_vaccine_names, f"{self.bopv}, {self.nopv2}")
        self.assertEqual(self.polio4_round_1_sub_activity1.single_vaccine_list, [self.bopv, self.nopv2])

        self.assertEqual(self.polio4_round_2_sub_activity1.vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio4_round_2_sub_activity1.vaccine_list, [self.mopv2])
        self.assertEqual(self.polio4_round_2_sub_activity1.single_vaccine_names, f"{self.mopv2}")
        self.assertEqual(self.polio4_round_2_sub_activity1.single_vaccine_list, [self.mopv2])


class CampaignSaveMethodTest(TestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data Source", account_name="Account", project_name="Project"
        )

        # Create org unit types
        cls.country_type = OrgUnitType.objects.create(name="Country", category="COUNTRY")
        cls.region_type = OrgUnitType.objects.create(name="Region", category="REGION")
        cls.district_type = OrgUnitType.objects.create(name="District", category="DISTRICT")

        # Create org units
        cls.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type=cls.country_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
        )

        cls.region = OrgUnit.objects.create(
            name="Test Region",
            org_unit_type=cls.region_type,
            parent=cls.country,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
        )

        cls.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type=cls.district_type,
            parent=cls.region,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
        )

        # Create campaign types
        # For some reason campaign types seem tp persist from other test class
        cls.polio_type = (
            CampaignType.objects.filter(name=CampaignType.POLIO).first()
            if CampaignType.objects.filter(name=CampaignType.POLIO).first()
            else CampaignType.objects.create(name=CampaignType.POLIO)
        )
        cls.measles_type = (
            CampaignType.objects.filter(name=CampaignType.MEASLES).first()
            if CampaignType.objects.filter(name=CampaignType.MEASLES).first()
            else CampaignType.objects.create(name=CampaignType.MEASLES)
        )

    def test_save_polio_campaign_with_integrated_to_raises_error(self):
        """Test that polio campaigns cannot be saved with integrated_to set"""
        # Create a polio campaign
        polio_campaign = Campaign.objects.create(
            obr_name="Test Polio Campaign", account=self.account, country=self.country
        )
        polio_campaign.campaign_types.add(self.polio_type)

        # Create another campaign to integrate to
        other_campaign = Campaign.objects.create(obr_name="Other Campaign", account=self.account, country=self.country)

        # Try to set integrated_to - should raise IntegrityError
        polio_campaign.integrated_to = other_campaign

        with self.assertRaises(IntegrityError) as context:
            polio_campaign.save()

        self.assertIn("Value of integrated_to must be NULL for Campaigns of type POLIO", str(context.exception))

    def test_save_polio_campaign_without_integrated_to_succeeds(self):
        """Test that polio campaigns can be saved without integrated_to"""
        polio_campaign = Campaign.objects.create(
            obr_name="Test Polio Campaign", account=self.account, country=self.country
        )
        polio_campaign.campaign_types.add(self.polio_type)

        # Should not raise any error
        polio_campaign.save()

        # Verify the campaign was saved
        polio_campaign.refresh_from_db()
        self.assertIn(self.polio_type, polio_campaign.campaign_types.all())

    def test_save_non_polio_campaign_with_integrated_to_succeeds(self):
        """Test that non-polio campaigns can be saved with integrated_to"""
        # Create a measles campaign
        measles_campaign = Campaign.objects.create(
            obr_name="Test Measles Campaign", account=self.account, country=self.country
        )
        measles_campaign.campaign_types.add(self.measles_type)

        # Create another campaign to integrate to
        other_campaign = Campaign.objects.create(obr_name="Other Campaign", account=self.account, country=self.country)

        # Set integrated_to - should not raise error
        measles_campaign.integrated_to = other_campaign
        measles_campaign.save()

        # Verify the campaign was saved with integrated_to
        measles_campaign.refresh_from_db()
        self.assertEqual(measles_campaign.integrated_to, other_campaign)

    def test_save_polio_campaign_with_none_integrated_to_succeeds(self):
        """Test that polio campaigns can be saved with integrated_to=None"""
        polio_campaign = Campaign.objects.create(
            obr_name="Test Polio Campaign", account=self.account, country=self.country, integrated_to=None
        )
        polio_campaign.campaign_types.add(self.polio_type)

        # Should not raise any error
        polio_campaign.save()

        # Verify the campaign was saved
        polio_campaign.refresh_from_db()
        self.assertIsNone(polio_campaign.integrated_to)
        self.assertIn(self.polio_type, polio_campaign.campaign_types.all())

    def test_country_cannot_be_manually_set(self):
        """Test that save doesn't override existing country if initial_org_unit is set"""
        campaign = Campaign(
            obr_name="Test Campaign", account=self.account, country=self.country, initial_org_unit=self.district
        )

        # Set a different country first
        different_country = OrgUnit.objects.create(
            name="Different Country",
            org_unit_type=self.country_type,
            version=self.source_version,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        campaign.country = different_country

        campaign.save()

        # Verify the existing country is not overridden
        campaign.refresh_from_db()
        self.assertEqual(campaign.country, self.country)

    def test_save_sets_country_from_initial_org_unit(self):
        """Test that country is set from initial_org_unit's country ancestor"""
        campaign = Campaign(obr_name="Test Campaign", account=self.account, initial_org_unit=self.district)

        campaign.save()

        # Verify country was set from the district's country ancestor
        campaign.refresh_from_db()
        self.assertEqual(campaign.country, self.country)

    @patch("plugins.polio.models.base.OrgUnit.DoesNotExist")
    def test_save_handles_org_unit_without_country_ancestor(self, mock_does_not_exist):
        """Test that save handles OrgUnit.DoesNotExist exception gracefully"""
        # Mock the exception to be raised
        mock_does_not_exist.side_effect = OrgUnit.DoesNotExist()
        # Create an org unit without proper hierarchy
        orphan_org_unit = OrgUnit.objects.create(
            name="Orphan Unit",
            org_unit_type=self.district_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=self.source_version,
        )

        campaign = Campaign(obr_name="Test Campaign", account=self.account, initial_org_unit=orphan_org_unit)

        # Should not raise an error, just pass silently
        campaign.save()

        # Verify campaign was saved
        campaign.refresh_from_db()
        self.assertEqual(campaign.obr_name, "Test Campaign")
        self.assertIsNone(campaign.country)

    def test_save_without_initial_org_unit(self):
        """Test that save works when initial_org_unit is None"""
        campaign = Campaign(obr_name="Test Campaign", account=self.account, country=self.country)

        campaign.save()

        # Verify campaign was saved
        campaign.refresh_from_db()
        self.assertEqual(campaign.obr_name, "Test Campaign")
        self.assertEqual(campaign.country, self.country)
