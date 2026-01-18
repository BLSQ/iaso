import datetime

from iaso.test import APITestCase
from plugins.polio.models.base import CampaignType
from plugins.polio.permissions import POLIO_PERMISSION
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
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [POLIO_PERMISSION])
        # user for other account
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=cls.another_account, permissions=[POLIO_PERMISSION]
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

    def test_month_params_format(self):
        if not self.endpoint:
            return
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.endpoint}?month=13-2021")
        response = self.assertJSONResponse(response, 400)
        response = self.client.get(f"{self.endpoint}?month=2021-04")
        response = self.assertJSONResponse(response, 400)
