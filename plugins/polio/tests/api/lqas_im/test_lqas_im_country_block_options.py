import datetime

from iaso.models.base import Group
from iaso.models.org_unit import OrgUnit
from plugins.polio.models import Round
from plugins.polio.models.base import VACCINES, SubActivity, SubActivityScope
from plugins.polio.tests.api.lqas_im.test_lqas_im_options import LqasImOptionsTestCase


class PolioLqasImCountryBlockOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/countryblockoptions/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # The one we expect to be returned
        cls.eligible_country_block = Group.objects.create(
            name="Good Country Block",
            block_of_countries=True,
            source_version=cls.source_version_1,
        )
        cls.eligible_country_block.org_units.set([cls.rdc, cls.benin])
        cls.eligible_country_block.save()

        # The one we expect to be excluded based on dates
        cls.ineligible_country_block = Group.objects.create(
            name="Bad Country Block",
            block_of_countries=True,
            source_version=cls.source_version_1,
        )
        # The one to be excluded based on account
        cls.country_block_wrong_account = Group.objects.create(
            name=" Wrong account Country Block",
            block_of_countries=True,
            source_version=cls.another_source_version,
        )
        cls.country_block_wrong_account.org_units.add(cls.india)
        cls.country_block_wrong_account.save()

        # Countries for ineligible country group. Same dates and settings as rdc and benin
        cls.zimbabwe_obr_name = "ZIMBABWE-DS-XXXX-TEST"
        (
            cls.zimbabwe_campaign,
            cls.zimbabwe_round_1,
            cls.zimbabwe_round_2,
            cls.zimbabwe_round_3,
            cls.zimbabwe,
            cls.bikita,
        ) = cls.create_campaign(
            cls.zimbabwe_obr_name,
            cls.account,
            cls.source_version_1,
            cls.ou_type_country,
            cls.ou_type_district,
            "ZIMBABWE",
            "BIKITA",
            cls.polio_type,
        )

        cls.zimbabwe_campaign.campaign_types.add(cls.polio_type)
        cls.zimbabwe_round_1.lqas_ended_at = datetime.date(2019, 1, 28)  # change date to avoid reusing default date
        cls.zimbabwe_round_1.save()
        cls.zimbabwe_round_2.lqas_ended_at = datetime.date(2019, 2, 28)  # check last day of month
        cls.zimbabwe_round_2.save()
        cls.zimbabwe_round_3.lqas_ended_at = datetime.date(2019, 4, 1)  # check first day of month
        cls.zimbabwe_round_3.save()

        cls.zambia_obr_name = "ZAMBIA-DS-XXXX-TEST"
        cls.zambia_campaign, cls.zambia_round_1, cls.zambia_round_2, cls.zambia_round_3, cls.zambia, cls.kaputa = (
            cls.create_campaign(
                cls.zambia_obr_name,
                cls.account,
                cls.source_version_1,
                cls.ou_type_country,
                cls.ou_type_district,
                "ZAMBIA",
                "KAPUTA",
            )
        )
        # TODO change dates
        cls.zambia_campaign.campaign_types.add(cls.polio_type)
        cls.zambia_campaign.save()
        # set the round 1 date 10 days before dec 31, no lqas end date
        cls.zambia_round_1.ended_at = datetime.date(2019, 12, 21)
        cls.zambia_round_1.save()
        # set the round 2 end date 10 days before May 1, with no lqas end date
        cls.zambia_round_2.ended_at = datetime.date(2019, 4, 21)
        cls.zambia_round_2.save()
        # move the round end date in june, set lqas end date in july to avoid ambiguity in test result
        cls.zambia_round_3.started_at = datetime.date(2019, 6, 10)
        cls.zambia_round_3.ended_at = datetime.date(2019, 6, 19)
        cls.zambia_round_3.lqas_ended_at = datetime.date(2019, 7, 1)
        cls.zambia_round_3.save()

        cls.ineligible_country_block.org_units.set([cls.zimbabwe, cls.zambia])
        cls.ineligible_country_block.save()

        cls.eligible_country_block.refresh_from_db()
        cls.ineligible_country_block.refresh_from_db()

    def test_filter_country_blocks_by_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        country_block_ids = [result["value"] for result in results]
        self.assertFalse(self.country_block_wrong_account.id in country_block_ids)

        response = self.client.get(
            f"{self.endpoint}?month=03-2021"
        )  # dates for india's rnd 3. response should not return it
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_get_without_params(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        result_ids = [r["value"] for r in results]
        self.assertTrue(self.eligible_country_block.id in result_ids)
        self.assertTrue(self.ineligible_country_block.id in result_ids)

    def test_return_blocks_with_lqas_end_date_within_month_param(self):
        self.client.force_authenticate(self.user)

        #  test when lqas end = last day of month
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test when lqas end = first day of month
        response = self.client.get(f"{self.endpoint}?month=02-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test when month start is one day after lqas end (here rdc round 2)
        response = self.client.get(f"{self.endpoint}?month=03-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_ignore_blocks_with_no_active_polio_campaigns(self):
        test_campaign, test_rnd1, test_rnd2, test_rnd3, cameroon, north_east = self.create_campaign(
            "Test Campaign",
            self.account,
            self.source_version_1,
            self.ou_type_country,
            self.ou_type_district,
            "CAMEROON",
            "NORTH EAST",
        )
        test_campaign.campaign_types.add(self.polio_type)
        test_campaign.refresh_from_db()

        test_rnd2.lqas_ended_at = self.rdc_round_2.lqas_ended_at
        test_rnd2.save()
        test_rnd3.lqas_ended_at = self.rdc_round_3.lqas_ended_at
        test_rnd3.save()

        new_eligible_country_block = Group.objects.create(
            name="New Country Block",
            block_of_countries=True,
            source_version=self.source_version_1,
        )
        new_eligible_country_block.org_units.add(cameroon)
        new_eligible_country_block.save()

        self.client.force_authenticate(self.user)
        # Return test campaign if active
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        labels = [result["label"] for result in results]
        values = [result["value"] for result in results]
        self.assertTrue(new_eligible_country_block.name in labels)
        self.assertTrue(new_eligible_country_block.id in values)
        self.assertTrue(self.eligible_country_block.name in labels)
        self.assertTrue(self.eligible_country_block.id in values)

        test_campaign.is_test = True
        test_campaign.save()

        #  Ignore new country block
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], new_eligible_country_block.name)
        self.assertNotEqual(result["value"], new_eligible_country_block.id)
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        test_campaign.is_test = False
        test_campaign.on_hold = True
        test_campaign.save()

        #  ignore campaign on hold
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], new_eligible_country_block.name)
        self.assertNotEqual(result["value"], new_eligible_country_block.id)
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        test_campaign.on_hold = False
        test_campaign.save()
        test_rnd3.on_hold = True
        test_rnd3.save()

        #  ignore if round for selected period is on hold
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], new_eligible_country_block.name)
        self.assertNotEqual(result["value"], new_eligible_country_block.id)
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

    def test_use_date_fallback_if_no_lqas_end_date(self):
        self.client.force_authenticate(self.user)

        # test end round +10 = first of month
        response = self.client.get(f"{self.endpoint}?month=05-2021")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test end round +10 = last of month
        response = self.client.get(f"{self.endpoint}?month=12-2020")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test first of month (end round +10) +1
        response = self.client.get(f"{self.endpoint}?month=01-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        # expect only eligible_country_block in result
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test (end round +10) = first of next month
        Round.objects.create(
            campaign=self.benin_campaign,
            started_at=datetime.date(2021, 8, 15),
            ended_at=datetime.date(2021, 8, 22),
            number=4,
        )
        response = self.client.get(f"{self.endpoint}?month=08-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_return_nothing_if_no_lqas_within_month(self):
        # Date after lqas dates available
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?month=10-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

        # Date before lqas dates available
        response = self.client.get(f"{self.endpoint}?month=11-2020")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_lqas_date_used_when_exists(self):
        self.client.force_authenticate(self.user)
        # Round ends in june
        response = self.client.get(f"{self.endpoint}?month=06-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)
        # But lqas ends in July
        response = self.client.get(f"{self.endpoint}?month=07-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

    def test_subactivities_dates_are_used(self):
        # Setup subactivity data
        new_campaign, new_rnd1, new_rnd2, new_rnd3, burundi, mukenke = self.create_campaign(
            "Test Campaign",
            self.account,
            self.source_version_1,
            self.ou_type_country,
            self.ou_type_district,
            "BURUNDI",
            "MUKENKE",
        )
        new_campaign.campaign_types.add(self.polio_type)
        new_campaign.refresh_from_db()

        vumbi = OrgUnit.objects.create(
            org_unit_type=self.ou_type_district,
            version=self.source_version_1,
            name="VUMBI",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        busoni = OrgUnit.objects.create(
            org_unit_type=self.ou_type_district,
            version=self.source_version_1,
            name="BUSONI",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PAI4RUMkr",
        )
        kirundo = OrgUnit.objects.create(
            org_unit_type=self.ou_type_district,
            version=self.source_version_1,
            name="KIRUNDO",
            validation_status=OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMr",
        )

        sub_activity_1 = SubActivity.objects.create(
            round=new_rnd1,
            name="SUBACTIVITY WITH LQAS DATES START OF MONTH",
            start_date=datetime.date(2023, 3, 20),
            end_date=datetime.date(2023, 3, 24),
            lqas_started_at=datetime.date(2023, 3, 30),
            lqas_ended_at=datetime.date(2023, 4, 1),  # use to check that lqas date is used
        )

        sub_activity_2 = SubActivity.objects.create(
            round=new_rnd2,
            name="SUBACTIVITY WITHOUT LQAS DATES",
            start_date=datetime.date(2023, 5, 28),
            end_date=datetime.date(2023, 5, 31),  # use to check that end date + 10 is used
        )
        sub_activity_3 = SubActivity.objects.create(
            round=new_rnd1,
            name="SUBACTIVITY WITH LQAS DATES END OF MONTH",
            start_date=datetime.date(2023, 7, 20),
            end_date=datetime.date(2023, 7, 22),
            lqas_started_at=datetime.date(2023, 7, 25),
            lqas_ended_at=datetime.date(2023, 7, 31),
        )

        vumbi_group = Group.objects.create(name="subactivity 1 scope", source_version=self.source_version_1)
        vumbi_group.org_units.set([vumbi])

        busoni_group = Group.objects.create(name="subactivity 2 scope", source_version=self.source_version_1)
        busoni_group.org_units.set([busoni])

        kirundo_group = Group.objects.create(name="subactivity 3 scope", source_version=self.source_version_1)
        kirundo_group.org_units.set([kirundo])

        scope_subact_1 = SubActivityScope.objects.create(
            group=vumbi_group, subactivity=sub_activity_1, vaccine=VACCINES[0][0]
        )

        scope_subact_2 = SubActivityScope.objects.create(
            group=busoni_group, subactivity=sub_activity_2, vaccine=VACCINES[0][0]
        )

        scope_subact_3 = SubActivityScope.objects.create(
            group=kirundo_group, subactivity=sub_activity_3, vaccine=VACCINES[0][0]
        )

        self.eligible_country_block.org_units.add(burundi)
        self.eligible_country_block.save()
        self.eligible_country_block.refresh_from_db()
        # Test starts here
        self.client.force_authenticate(self.user)
        #  test when lqas end = last day of month
        response = self.client.get(f"{self.endpoint}?month=07-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test when lqas end = first day of month
        response = self.client.get(f"{self.endpoint}?month=04-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # test when month start is one day after lqas end
        response = self.client.get(f"{self.endpoint}?month=08-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

        # Activity ends in March,
        response = self.client.get(f"{self.endpoint}?month=03-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)
        # LQAS in April
        response = self.client.get(f"{self.endpoint}?month=04-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)

        # fallback on end date if no lqas
        response = self.client.get(f"{self.endpoint}?month=05-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

        response = self.client.get(f"{self.endpoint}?month=06-2023")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.eligible_country_block.name)
        self.assertEqual(result["value"], self.eligible_country_block.id)
