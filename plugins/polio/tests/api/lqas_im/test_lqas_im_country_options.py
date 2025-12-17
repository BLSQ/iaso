import datetime

from typing_extensions import override

from plugins.polio.models import Round
from plugins.polio.tests.api.lqas_im.test_lqas_im_options import LqasImOptionsTestCase


class PolioLqasImCountriesOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/countriesoptions/"

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

    def test_filter_org_units_by_account_and_app_id(self):
        # anon user should provide app_id
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response["results"]), 0)
        response = self.client.get(f"{self.endpoint}?app_id={self.project.app_id}")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        org_unit_ids = [result["value"] for result in results]
        self.assertFalse(self.india.id in org_unit_ids)

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
