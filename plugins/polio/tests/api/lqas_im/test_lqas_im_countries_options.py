import datetime

from iaso.test import APITestCase
from plugins.polio.tests.api.test import PolioTestCaseMixin


class PolioCountriesOptionsTestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.endpoint = "/api/polio/lqasim/countriesoptions/"
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
        )
        cls.rdc_round_3.lqas_ended_at = datetime.date(2021, 4, 1)
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
        # set the round 2 end date in may, with no lqas end date
        cls.benin_round_2.ended_at = datetime.date(2021, 5, 15)
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

    def test_get_without_auth(self):
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 401)

    def test_get_without_perm(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 403)
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 403)

    def test_get_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        self.assertJSONResponse(response, 200)

    def test_filter_org_units_by_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)
        org_unit_ids = [result["value"] for result in results]
        self.assertFalse(self.india.id in org_unit_ids)

    def test_response_shape(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        response = self.assertJSONResponse(response, 200)
        res_keys = list(response.keys())
        self.assertEqual(res_keys, ["results"])
        results = response["results"]
        result_keys = list(results[1].keys())
        self.assertEqual(result_keys, ["label", "value"])

    def test_get_without_params(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.endpoint)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 2)

    def test_return_campaign_with_lqasend_date_within_month_param(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?month=04-2021")  # expecting rdc in result
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.rdc.name)
        self.assertEqual(result["value"], self.rdc.id)

    def test_use_date_fallback_if_no_lqas_end_date(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            f"{self.endpoint}?month=05-2021"
        )  # expecting benin in result (round end date +10 days)
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["label"], self.benin.name)
        self.assertEqual(result["value"], self.benin.id)

    def test_return_nothing_if_no_lqas_within_month(self):
        # Date after lqas dates available
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?month=08-2021")
        json_response = self.assertJSONResponse(response, 200)
        results = json_response["results"]
        self.assertEqual(len(results), 0)

        # Date before lqas dates available
        response = self.client.get(f"{self.endpoint}?month=12-2020")
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
