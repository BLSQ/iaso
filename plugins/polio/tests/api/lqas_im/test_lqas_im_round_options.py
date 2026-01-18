import datetime

from typing_extensions import override

from plugins.polio.models import Round
from plugins.polio.tests.api.lqas_im.test_lqas_im_options import LqasImOptionsTestCase


class PolioLqasImRoundOptionsTestCase(LqasImOptionsTestCase):
    endpoint = "/api/polio/lqasim/roundoptions/"

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
