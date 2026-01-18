from rest_framework import status

from iaso.models.org_unit import OrgUnitType
from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep
from plugins.polio.models import CampaignType, Round
from plugins.polio.permissions import POLIO_BUDGET_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


BASE_URL = "/api/polio/dashboards/budgets/"


class BudgetDashboardAPITestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Account", "Data source", "Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [POLIO_BUDGET_PERMISSION])
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
        cls.budget_process_deleted = BudgetProcess.objects.create(
            created_by=cls.user, deleted_at="2024-01-06", current_state_label="budget deleted"
        )

        # Rounds.
        cls.round_1.budget_process = cls.budget_process_1
        cls.round_1.save()
        cls.round_2.budget_process = cls.budget_process_1
        cls.round_2.save()
        cls.round_3.budget_process = cls.budget_process_2
        cls.round_3.save()
        cls.round_4 = Round.objects.create(number=4, campaign=cls.campaign, budget_process=None)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)
        cls.budget_step_2 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)

    def test_anonymous_user_cannot_get(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_permission(self):
        self.client.force_authenticate(self.user_no_perms)
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

    def test_list_budget_processes(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["id"], self.budget_process_1.id)
        self.assertEqual(results[0]["obr_name"], self.campaign.obr_name)
        self.assertEqual(results[1]["id"], self.budget_process_2.id)

    def test_list_with_deleted_campaign(self):
        # Setting up new campaign with rounds and budget processes, then we delete it
        new_campaign, new_round_1, new_round_2, new_round_3, self.country, self.district = self.create_campaign(
            obr_name="New Campaign",
            account=self.account,
            source_version=self.source_version,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        new_campaign.campaign_types.set([self.polio_type])
        new_budget_process_1 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 1")
        new_budget_process_2 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 2")
        new_round_1.budget_process = new_budget_process_1
        new_round_1.save()
        new_round_2.budget_process = new_budget_process_1
        new_round_2.save()
        new_round_3.budget_process = new_budget_process_2
        new_round_3.save()
        new_campaign.delete()

        # Now we check that we only have the initial ones
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)  # both from the setup
        self.assertEqual(results[0]["id"], self.budget_process_1.id)
        self.assertEqual(results[1]["id"], self.budget_process_2.id)

    def test_list_with_other_account(self):
        # Setting up new campaign with rounds and budget processes, in another account
        new_account, new_data_source, new_source_version, new_project = self.create_account_datasource_version_project(
            "New Account", "New Data source", "New Project"
        )
        new_campaign, new_round_1, new_round_2, new_round_3, self.country, self.district = self.create_campaign(
            obr_name="New Campaign",
            account=new_account,
            source_version=new_source_version,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        new_campaign.campaign_types.set([self.polio_type])
        new_budget_process_1 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 1")
        new_budget_process_2 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 2")
        new_round_1.budget_process = new_budget_process_1
        new_round_1.save()
        new_round_2.budget_process = new_budget_process_1
        new_round_2.save()
        new_round_3.budget_process = new_budget_process_2
        new_round_3.save()

        # Now we check that we only have the initial ones
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)  # both from the setup
        self.assertEqual(results[0]["id"], self.budget_process_1.id)
        self.assertEqual(results[1]["id"], self.budget_process_2.id)

    def test_list_with_rounds_without_campaign(self):
        # Since this is an issue, we want to make sure that campaignless rounds do not interfere
        new_campaign, new_round_1, new_round_2, new_round_3, self.country, self.district = self.create_campaign(
            obr_name="New Campaign",
            account=self.account,
            source_version=self.source_version,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        new_campaign.campaign_types.set([self.polio_type])
        new_budget_process_1 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 1")
        new_budget_process_2 = BudgetProcess.objects.create(created_by=self.user, current_state_label="New budget 2")
        new_round_1.campaign = None
        new_round_1.budget_process = new_budget_process_1
        new_round_1.save()
        new_round_2.campaign = None
        new_round_2.budget_process = new_budget_process_1
        new_round_2.save()
        new_round_3.budget_process = new_budget_process_2
        new_round_3.save()

        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 3)  # both from the setup + new_budget_process_2
        self.assertEqual(results[0]["id"], self.budget_process_1.id)
        self.assertEqual(results[1]["id"], self.budget_process_2.id)
        self.assertEqual(results[2]["id"], new_budget_process_2.id)
        self.assertEqual(results[2]["obr_name"], new_campaign.obr_name)
