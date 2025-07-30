import datetime

from iaso.models.base import GROUP_DOMAIN, Group
from iaso.models.org_unit import OrgUnit
from iaso.test import APITestCase
from plugins.polio.models import Round
from plugins.polio.models.base import VACCINES, CampaignType, SubActivity, SubActivityScope
from plugins.polio.tests.api.test import PolioTestCaseMixin


class LqasImOptionsTestCase(APITestCase, PolioTestCaseMixin):
    endpoint: str
    endpoint = ""

    @classmethod
    def setUpTestData(cls):
        # Datasource, source version, project and account
        cls.account, cls.datasource, cls.source_version_1, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Default account", "Default project"
        )
        # Datasource, source version, project and account to exclude (e.g. when testing filters)
        (cls.another_account, cls.another_datasource, cls.another_source_version, cls.another_project) = (
            cls.create_account_datasource_version_project("Other source", "Other account", "Other project")
        )
        # anonymous user and user without needed permissions
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, ["iaso_polio"])
        # user for other account
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=cls.another_account, permissions=["iaso_polio"]
        )

        # org unit types to create campaigns and scopes
        cls.ou_type_country = cls.create_org_unit_type(name="COUNTRY", projects=[cls.project])
        cls.ou_type_district = cls.create_org_unit_type(name="DISTRICT", projects=[cls.project])

        # org unit types to create campaigns and scopes for other account
        cls.country_type2 = cls.create_org_unit_type(
            name="OTHER_COUNTRY", projects=[cls.another_project], category="COUNTRY"
        )
        cls.district_type2 = cls.create_org_unit_type(
            name="OTHER_DISTRICT", projects=[cls.another_project], category="DISTRICT"
        )
        cls.polio_type, _ = CampaignType.objects.get_or_create(name=CampaignType.POLIO)
        cls.measles_type, _ = CampaignType.objects.get_or_create(name=CampaignType.MEASLES)

        cls.rdc_obr_name = "DRC-DS-XXXX-TEST"
        # RDC, campaign with "default" settings
        cls.rdc_campaign, cls.rdc_round_1, cls.rdc_round_2, cls.rdc_round_3, cls.rdc, cls.katanga = cls.create_campaign(
            cls.rdc_obr_name,
            cls.account,
            cls.source_version_1,
            cls.ou_type_country,
            cls.ou_type_district,
            "RDC",
            "KATANGA",
            cls.polio_type,
        )
        cls.rdc_campaign.campaign_types.add(cls.polio_type)
        cls.rdc_round_2.lqas_ended_at = datetime.date(2021, 2, 28)  # check last day of month
        cls.rdc_round_2.save()
        cls.rdc_round_3.lqas_ended_at = datetime.date(2021, 4, 1)  # check first day of month
        cls.rdc_round_3.save()

        cls.benin_obr_name = "BENIN-DS-XXXX-TEST"
        cls.benin_campaign, cls.benin_round_1, cls.benin_round_2, cls.benin_round_3, cls.benin, cls.kandi = (
            cls.create_campaign(
                cls.benin_obr_name,
                cls.account,
                cls.source_version_1,
                cls.ou_type_country,
                cls.ou_type_district,
                "BENIN",
                "KANDI",
            )
        )
        cls.benin_campaign.campaign_types.add(cls.polio_type)
        cls.benin_campaign.save()
        # set the round 1 date 10 days before dec 31, no lqas end date
        cls.benin_round_1.ended_at = datetime.date(2020, 12, 21)
        cls.benin_round_1.save()
        # set the round 2 end date 10 days before May 1, with no lqas end date
        cls.benin_round_2.ended_at = datetime.date(2021, 4, 21)
        cls.benin_round_2.save()
        # move the round end date in june, set lqas end date in july to avoid ambiguity in test result
        cls.benin_round_3.started_at = datetime.date(2021, 6, 10)
        cls.benin_round_3.ended_at = datetime.date(2021, 6, 19)
        cls.benin_round_3.lqas_ended_at = datetime.date(2021, 7, 1)
        cls.benin_round_3.save()

        cls.india_obr_name = "INDIA-DS-XXXX-TEST"
        # Campaign and countries on other datasource and account
        cls.emro_campaign, cls.india_round_1, cls.india_round_2, cls.india_round_3, cls.india, cls.mumbai = (
            cls.create_campaign(
                cls.india_obr_name,
                cls.another_account,
                cls.another_source_version,
                cls.country_type2,
                cls.district_type2,
                "INDIA",
                "MUMBAI",
            )
        )
        cls.emro_campaign.campaign_types.add(cls.polio_type)
        cls.emro_campaign.save()

        cls.rdc_campaign.refresh_from_db()
        cls.benin_campaign.refresh_from_db()
        cls.emro_campaign.refresh_from_db()

    def test_get_without_auth(self):
        if not self.endpoint:
            return
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 401)

    def test_get_without_perm(self):
        if not self.endpoint:
            return
        self.client.force_authenticate(self.anon)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 403)
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 403)

    def test_get_ok(self):
        if not self.endpoint:
            return
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 200)

    def test_response_shape(self):
        if not self.endpoint:
            return
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        response = self.assertJSONResponse(response, 200)
        res_keys = list(response.keys())
        self.assertEqual(res_keys, ["results"])
        results = response["results"]
        result_keys = list(results[1].keys())
        self.assertEqual(result_keys, ["value", "label"])


class PolioLqasImCountriesOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/countriesoptions/"

    def test_filter_org_units_by_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        org_unit_ids = [result["value"] for result in results]
        self.assertFalse(self.india.id in org_unit_ids)

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

    def test_return_campaign_with_lqasend_date_within_month_param(self):
        self.client.force_authenticate(self.user)

        #  test when lqas end = last day of month
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

        # test when lqas end = first day of month
        response = self.client.get(f"{self.endpoint}?month=02-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

        # test when month start is one day after lqas end (here rdc round 2)
        response = self.client.get(f"{self.endpoint}?month=03-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_ignore_countries_with_no_active_polio_campaigns(self):
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

        self.client.force_authenticate(self.user)
        # Return test campaign if active
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        labels = [result["label"] for result in results]
        values = [result["value"] for result in results]
        self.assertTrue(cameroon.name in labels)
        self.assertTrue(cameroon.id in values)
        self.assertTrue(self.rdc.name in labels)
        self.assertTrue(self.rdc.id in values)

        test_campaign.is_test = True
        test_campaign.save()

        #  Ignore test campaign
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], cameroon.name)
        self.assertNotEqual(result["value"], cameroon.id)
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

        test_campaign.is_test = False
        test_campaign.on_hold = True
        test_campaign.save()

        #  ingnore campaign on hold
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], cameroon.name)
        self.assertNotEqual(result["value"], cameroon.id)
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

        test_campaign.on_hold = False
        test_campaign.save()
        test_rnd3.on_hold = True
        test_rnd3.save()

        #  ingnore if round for selected period is on hold
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertNotEqual(result["label"], cameroon.name)
        self.assertNotEqual(result["value"], cameroon.id)
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

    def test_use_date_fallback_if_no_lqas_end_date(self):
        self.client.force_authenticate(self.user)

        # test end round +10 = first of month
        response = self.client.get(f"{self.endpoint}?month=05-2021")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.benin.name)
        self.assertEqual(result["value"], self.benin.id)

        # test end round +10 = last of month
        response = self.client.get(f"{self.endpoint}?month=12-2020")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.benin.name)
        self.assertEqual(result["value"], self.benin.id)

        # test first of month (end round +10) +1
        response = self.client.get(f"{self.endpoint}?month=01-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        # expect only rdc in result
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

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
        self.assertEqual(result["label"], self.benin.name)
        self.assertEqual(result["value"], self.benin.id)


class PolioLqasImCampaignOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/campaignoptions/"

    def test_filter_campaigns_for_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        campaign_ids = [result["value"] for result in results]
        self.assertFalse(str(self.emro_campaign.id) in campaign_ids)

        response = self.client.get(
            f"{self.endpoint}?month=03-2021"
        )  # dates for india's rnd 3. response should not return it
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_only_return_active_polio_campaigns(self):
        self.client.force_authenticate(self.user)
        test_campaign, _, _, test_rnd3, _, _ = self.create_campaign(
            "test_campaign",
            self.account,
            self.source_version_1,
            self.ou_type_country,
            self.ou_type_district,
            "RDC1",
            "BAS UELE",
        )
        test_campaign.campaign_types.add(self.polio_type)
        test_campaign.refresh_from_db()

        # Normal case, return test campaign        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 3)
        campaign_ids = [result["value"] for result in results]
        self.assertTrue(str(test_campaign.id) in campaign_ids)

        # exclude test campaign
        test_campaign.is_test = True
        test_campaign.save()
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        campaign_ids = [result["value"] for result in results]
        self.assertFalse(str(test_campaign.id) in campaign_ids)

        # exclude test campaign on hold
        test_campaign.is_test = False
        test_campaign.on_hold = True
        test_campaign.save()
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        campaign_ids = [result["value"] for result in results]
        self.assertFalse(str(test_campaign.id) in campaign_ids)

        # # exclude test campaign if relevant round is on hold
        test_campaign.is_test = False
        test_campaign.on_hold = False
        test_campaign.save()
        test_rnd3.lqas_ended_at = self.rdc_round_3.lqas_ended_at
        test_rnd3.on_hold = True
        test_rnd3.save()
        response = self.client.get(f"{self.endpoint}?month=04-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(
            len(results), 1
        )  # One result less because we filtered on date to target the round specifically
        campaign_ids = [result["value"] for result in results]

        # exclude test campaign if not polio type
        test_campaign.is_test = False
        test_campaign.on_hold = False
        test_campaign.save()
        test_campaign.campaign_types.set([self.measles_type])
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        campaign_ids = [result["value"] for result in results]
        self.assertFalse(str(test_campaign.id) in campaign_ids)

    def test_get_without_params(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)

    def filter_by_country(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?country_id={self.rdc.id}")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["value"], self.rdc.id)

    def test_return_campaign_with_lqasend_date_within_month_param(self):
        self.client.force_authenticate(self.user)

        #  test when lqas end = last day of month
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.rdc_campaign.obr_name)
        self.assertEqual(result["value"], str(self.rdc_campaign.id))

        # test when lqas end = first day of month
        response = self.client.get(f"{self.endpoint}?month=02-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.rdc_campaign.obr_name)
        self.assertEqual(result["value"], str(self.rdc_campaign.id))

        # test when month start is one day after lqas end (here rdc round 2)
        response = self.client.get(f"{self.endpoint}?month=03-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_use_date_fallback_if_no_lqas_end_date(self):
        self.client.force_authenticate(self.user)

        # test end round +10 = first of month
        response = self.client.get(f"{self.endpoint}?month=05-2021")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.benin_campaign.obr_name)
        self.assertEqual(result["value"], str(self.benin_campaign.id))

        # test end round +10 = last of month
        response = self.client.get(f"{self.endpoint}?month=12-2020")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.benin_campaign.obr_name)
        self.assertEqual(result["value"], str(self.benin_campaign.id))

        # test first of month (end round +10) +1
        response = self.client.get(f"{self.endpoint}?month=01-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        # expect only rdc in result
        self.assertEqual(result["label"], self.rdc_campaign.obr_name)
        self.assertEqual(result["value"], str(self.rdc_campaign.id))

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
        self.assertEqual(result["label"], self.benin_campaign.obr_name)
        self.assertEqual(result["value"], str(self.benin_campaign.id))


class PolioLqasImRoundOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/roundoptions/"

    def test_filter_rounds_for_user(self):
        # Add a rnd 4 to the India campaign to test it's not returned in the results

        india_rnd_4 = Round.objects.create(
            campaign=self.emro_campaign,
            started_at=datetime.date(2021, 6, 1),
            ended_at=datetime.date(2021, 6, 10),
            number=4,
        )

        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 6)
        round_numbers = [result["value"] for result in results]
        self.assertFalse(str(india_rnd_4.number) in round_numbers)

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
        self.assertEqual(len(results), 6)  # 2 campaigns * 3 rounds

    def test_filter_by_campaign(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?campaign_id={self.rdc_campaign.id}")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 3)
        round_numbers = [result["value"] for result in results]
        self.assertTrue(str(self.rdc_round_1.number) in round_numbers)
        self.assertTrue(str(self.rdc_round_2.number) in round_numbers)
        self.assertTrue(str(self.rdc_round_3.number) in round_numbers)

    def test_filter_out_rounds_on_hold(self):
        self.client.force_authenticate(self.user)
        test_campaign, _, test_rnd2, _, _, _ = self.create_campaign(
            "test_campaign",
            self.account,
            self.source_version_1,
            self.ou_type_country,
            self.ou_type_district,
            "RDC1",
            "BAS UELE",
        )
        test_campaign.campaign_types.add(self.polio_type)
        test_campaign.refresh_from_db()
        test_rnd2.lqas_ended_at = self.rdc_round_3.lqas_ended_at
        test_rnd2.save()

        # return test round 2
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        round_numbers = [result["value"] for result in results]
        self.assertTrue(str(test_rnd2.number) in round_numbers)
        self.assertTrue(str(self.rdc_round_3.number) in round_numbers)

        # exclude test round 2 if on hold

        test_rnd2.on_hold = True
        test_rnd2.save()
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        round_numbers = [result["value"] for result in results]
        self.assertFalse(str(test_rnd2.number) in round_numbers)
        self.assertTrue(str(self.rdc_round_3.number) in round_numbers)

    def test_return_rounds_with_lqasend_date_within_month_param(self):
        self.client.force_authenticate(self.user)

        #  test when lqas end = last day of month
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], f"Round {self.rdc_round_3.number}")
        self.assertEqual(result["value"], str(self.rdc_round_3.number))

        # test when lqas end = first day of month
        response = self.client.get(f"{self.endpoint}?month=02-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], f"Round {self.rdc_round_2.number}")
        self.assertEqual(result["value"], str(self.rdc_round_2.number))

        # test when month start is one day after lqas end (here rdc round 2)
        response = self.client.get(f"{self.endpoint}?month=03-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

    def test_use_date_fallback_if_no_lqas_end_date(self):
        self.client.force_authenticate(self.user)

        # test end round +10 = first of month
        response = self.client.get(f"{self.endpoint}?month=05-2021")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], f"Round {self.benin_round_2.number}")
        self.assertEqual(result["value"], str(self.benin_round_2.number))

        # test end round +10 = last of month
        response = self.client.get(f"{self.endpoint}?month=12-2020")  # expecting benin in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], f"Round {self.benin_round_1.number}")
        self.assertEqual(result["value"], str(self.benin_round_1.number))

        # test first of month (end round +10) +1
        response = self.client.get(f"{self.endpoint}?month=01-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        # expect only rdc in result
        self.assertEqual(result["label"], f"Round {self.rdc_round_1.number}")
        self.assertEqual(result["value"], str(self.rdc_round_1.number))

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
        self.assertEqual(result["label"], f"Round {self.benin_round_3.number}")
        self.assertEqual(result["value"], str(self.benin_round_3.number))


class PolioLqasImCountryBlockOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/countryblockoptions/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # The one we expect to be returned
        cls.eligible_country_block = Group.objects.create(
            name="Good Country Block",
            domain=GROUP_DOMAIN[0][0],
            block_of_countries=True,
            source_version=cls.source_version_1,
        )
        cls.eligible_country_block.org_units.set([cls.rdc, cls.benin])
        cls.eligible_country_block.save()

        # The one we expect to be excluded based on dates
        cls.ineligible_country_block = Group.objects.create(
            name="Bad Country Block",
            domain=GROUP_DOMAIN[0][0],
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
            domain=GROUP_DOMAIN[0][0],
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

        #  ingnore if round for selected period is on hold
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
