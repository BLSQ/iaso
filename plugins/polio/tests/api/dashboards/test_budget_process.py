import datetime

from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import now
from rest_framework import status

from iaso.models.base import Group
from iaso.models.org_unit import OrgUnitType
from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep
from plugins.polio.models import SubActivity, SubActivityScope, CampaignType, Round
from plugins.polio.tests.api.test import PolioTestCaseMixin
from plugins.polio.tests.test_api import PolioAPITestCase

BASE_URL = "/api/polio/dashboards/budgets/"


class BudgetDashboardAPITestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Account", "Data source", "Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, ["iaso_polio_budget"])
        cls.country_type = OrgUnitType.objects.create(name="COUNTRY", short_name="COUNTRY")
        cls.district_type = OrgUnitType.objects.create(name="DISTRICT", short_name="DISTRICT")
        # Campaign type.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)

        cls.campaign, cls.round_1, cls.round_2, cls.round_3, cls.country, cls.district = cls.create_campaign(
            obr_name="Test Campaign",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.campaign.campaign_types.set([cls.polio_type])

        # Budget Processes.
        cls.budget_process_1 = BudgetProcess.objects.create(created_by=cls.user, current_state_label="budget 1")
        cls.budget_process_2 = BudgetProcess.objects.create(created_by=cls.user, current_state_label="budget 2")
        cls.budget_process_deleted = BudgetProcess.objects.create(created_by=cls.user, deleted_at="2024-01-06", current_state_label="budget deleted")

        # Rounds.
        cls.round_1.budget_process = cls.budget_process_1
        cls.round_2.budget_process = cls.budget_process_1
        cls.round_3.budget_process = cls.budget_process_2
        cls.round_4 = Round.objects.create(number=4, campaign=cls.campaign, budget_process=None)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)
        cls.budget_step_2 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)

    def test_anonymous_user_cannot_get(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_default_pagination_is_added(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], 20)

    def test_max_page_size_is_enforced(self):
        default_max_page_size = 1000  # default value from EtlPaginator
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}?limit=2000&page=1")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], default_max_page_size)

    def test_get_budget_processes(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["id"], self.budget_process_1.id)

    # test with deleted campaign
    # test the result other than ID
    # test with another account
    # test with rounds without campaign


