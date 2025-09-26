from iaso.test import APITestCase
from plugins.polio import models as pm
from plugins.polio.models.base import VACCINES
from plugins.polio.permissions import POLIO_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


class VaccineStockHistoryTestCase(APITestCase, PolioTestCaseMixin):
    """
    Test Vaccine stock history API (viewset, filters, serializer).
    """

    @classmethod
    def setUpTestData(cls):
        # Datasource, source version, project and account
        cls.account, cls.datasource, cls.source_version_1, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Default account", "Default project"
        )
        # Datasource, source version, project and account to exclude (e.g. when testing filters)
        (cls.another_account, cls.another_datasource, *rest) = cls.create_account_datasource_version_project(
            "Other source", "Other account", "Other project"
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

        # vaccine mopv
        cls.stock_rdc = pm.VaccineStock.objects.create(account=cls.account, country=cls.rdc, vaccine=VACCINES[0][0])

        cls.history_rdc_round_1 = pm.VaccineStockHistory.objects.create(
            vaccine_stock=cls.stock_rdc,
            round=cls.rdc_round_1,
            unusable_vials_in=1000,
            unusable_vials_out=100,
            unusable_doses_in=20000,
            unusable_doses_out=2000,
            usable_vials_in=2000,
            usable_vials_out=200,
            usable_doses_in=40000,
            usable_doses_out=4000,
        )

        cls.history_rdc_round_2 = pm.VaccineStockHistory.objects.create(
            vaccine_stock=cls.stock_rdc,
            round=cls.rdc_round_2,
            unusable_vials_in=100,
            unusable_vials_out=10,
            unusable_doses_in=2000,
            unusable_doses_out=200,
            usable_vials_in=200,
            usable_vials_out=20,
            usable_doses_in=4000,
            usable_doses_out=400,
        )

        cls.history_rdc_round_3 = pm.VaccineStockHistory.objects.create(
            vaccine_stock=cls.stock_rdc,
            round=cls.rdc_round_3,
            unusable_vials_in=10,
            unusable_vials_out=1,
            unusable_doses_in=200,
            unusable_doses_out=20,
            usable_vials_in=20,
            usable_vials_out=2,
            usable_doses_in=400,
            usable_doses_out=40,
        )
        cls.chad_obr_name = "CHAD-DS-XXX-TEST"
        # CHAD, campaign with vaccine = nOPV
        (
            cls.chad_campaign,
            cls.chad_round_1,
            cls.chad_round_2,
            cls.chad_round_3,
            cls.chad,
            cls.bedaya,
        ) = cls.create_campaign(
            cls.chad_obr_name,
            cls.account,
            cls.source_version_1,
            cls.ou_type_country,
            cls.ou_type_district,
            "CHAD",
            "BEDAYA",
        )
        # vaccine nopv
        cls.stock_chad = pm.VaccineStock.objects.create(account=cls.account, country=cls.chad, vaccine=VACCINES[1][0])
        cls.history_chad_round_1 = pm.VaccineStockHistory.objects.create(
            vaccine_stock=cls.stock_chad,
            round=cls.chad_round_1,
            unusable_vials_in=500,
            unusable_vials_out=50,
            unusable_doses_in=10000,
            unusable_doses_out=1000,
            usable_vials_in=1000,
            usable_vials_out=100,
            usable_doses_in=20000,
            usable_doses_out=2000,
        )

        cls.history_chad_round_2 = pm.VaccineStockHistory.objects.create(
            vaccine_stock=cls.stock_chad,
            round=cls.chad_round_2,
            unusable_vials_in=50,
            unusable_vials_out=5,
            unusable_doses_in=1000,
            unusable_doses_out=100,
            usable_vials_in=100,
            usable_vials_out=10,
            usable_doses_in=2000,
            usable_doses_out=200,
        )

    def test_anonymous_user_cannot_access(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(
            "/api/polio/dashboards/vaccine_stock_history/",
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_without_permission_cannot_access(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(
            "/api/polio/dashboards/vaccine_stock_history/",
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def results_filtered_by_account(self):
        self.client.force_authenticate(user=self.user_other_account)
        response = self.client.get(
            "/api/polio/dashboards/vaccine_stock_history/",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        self.assertEqual(len(results), 0)

    def test_get_list_no_query_params(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            "/api/polio/dashboards/vaccine_stock_history/",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        self.assertEqual(len(results), 5)

    def test_filter_by_country(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?country={self.rdc.id}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        # rdc has 3 stocks in the setup
        self.assertEqual(len(results), 3)

        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?country={self.chad.id}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        # chad has 2 stocks in the setup
        self.assertEqual(len(results), 2)

    def test_filter_by_campaign(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?campaign={self.rdc_obr_name}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        # rdc has 3 stocks in the setup
        self.assertEqual(len(results), 3)

        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?campaign={self.chad_obr_name}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        # chad has 2 stocks in the setup
        self.assertEqual(len(results), 2)

    def test_filter_by_round(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?round={self.rdc_round_1.id}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        self.assertEqual(len(results), 1)
        archived_stock = results[0]
        self.assertEqual(archived_stock["unusable_vials_in"], self.history_rdc_round_1.unusable_vials_in)
        self.assertEqual(archived_stock["unusable_doses_in"], self.history_rdc_round_1.unusable_doses_in)
        self.assertEqual(archived_stock["unusable_vials_out"], self.history_rdc_round_1.unusable_vials_out)
        self.assertEqual(archived_stock["unusable_doses_out"], self.history_rdc_round_1.unusable_doses_out)
        self.assertEqual(archived_stock["usable_vials_in"], self.history_rdc_round_1.usable_vials_in)
        self.assertEqual(archived_stock["usable_doses_in"], self.history_rdc_round_1.usable_doses_in)
        self.assertEqual(archived_stock["usable_vials_out"], self.history_rdc_round_1.usable_vials_out)
        self.assertEqual(archived_stock["usable_doses_out"], self.history_rdc_round_1.usable_doses_out)

        response = self.client.get(
            f"/api/polio/dashboards/vaccine_stock_history/?round={self.chad_round_1.id}",
            format="json",
        )
        response = self.assertJSONResponse(response, 200)
        results = response["results"]
        self.assertEqual(len(results), 1)
        archived_stock = results[0]
        self.assertEqual(archived_stock["unusable_vials_in"], self.history_chad_round_1.unusable_vials_in)
        self.assertEqual(archived_stock["unusable_doses_in"], self.history_chad_round_1.unusable_doses_in)
        self.assertEqual(archived_stock["unusable_vials_out"], self.history_chad_round_1.unusable_vials_out)
        self.assertEqual(archived_stock["unusable_doses_out"], self.history_chad_round_1.unusable_doses_out)
        self.assertEqual(archived_stock["usable_vials_in"], self.history_chad_round_1.usable_vials_in)
        self.assertEqual(archived_stock["usable_doses_in"], self.history_chad_round_1.usable_doses_in)
        self.assertEqual(archived_stock["usable_vials_out"], self.history_chad_round_1.usable_vials_out)
        self.assertEqual(archived_stock["usable_doses_out"], self.history_chad_round_1.usable_doses_out)
