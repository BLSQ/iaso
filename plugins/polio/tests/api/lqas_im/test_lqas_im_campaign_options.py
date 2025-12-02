import datetime

from typing_extensions import override

from plugins.polio.models import Round
from plugins.polio.tests.api.lqas_im.test_lqas_im_options import LqasImOptionsTestCase


class PolioLqasImCampaignOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/campaignoptions/"

    @override
    def test_get_without_auth(self):
        """GET - Read-only access to anonymous users for page embedding"""
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 200)

    @override
    def test_get_without_perm(self):
        """GET - Read-only access  for page embedding"""
        self.client.force_authenticate(self.anon)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 200)
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 200)

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
