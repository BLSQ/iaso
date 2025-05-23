import datetime
import json

from io import StringIO
from typing import Dict, List
from unittest import mock, skip

from django.contrib.auth.models import Permission
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.template import Context, Engine
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep, MailTemplate
from plugins.polio.models import Campaign, CampaignType, Round
from plugins.polio.tests.utils.budget import get_mocked_workflow


@mock.patch("plugins.polio.budget.models.get_workflow", get_mocked_workflow)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_mocked_workflow)
class BudgetProcessViewSetTestCase(APITestCase):
    """
    Test actions on `BudgetProcessViewSet`.
    """

    maxDiff = None

    def jsonListContains(self, actual: List[Dict], expected: List[Dict]):
        """
        Check that each dict in the expect list is contained as a subset of a dict in actual.
        """

        def dictContains(actual_d, expected_d):
            for k, v in expected_d.items():
                if not actual_d[k] == v:
                    return False
            return True

        for d in expected:
            self.assertTrue(
                any(dictContains(actual_d, d) for actual_d in actual),
                f"{d} not found in {actual}",
            )

    @classmethod
    def setUpTestData(cls) -> None:
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            username="test",
            first_name="test",
            last_name="test",
            account=cls.account,
            permissions=["iaso_polio_budget"],
        )

        # Campaign type.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)

        # Campaign.
        cls.campaign = Campaign.objects.create(
            obr_name="test campaign",
            account=cls.user.iaso_profile.account,
            country=m.OrgUnit.objects.create(name="ANGOLA"),
        )
        cls.campaign.campaign_types.set([cls.polio_type])

        # Budget Processes.
        cls.budget_process_1 = BudgetProcess.objects.create(created_by=cls.user)
        cls.budget_process_2 = BudgetProcess.objects.create(created_by=cls.user)

        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_3 = Round.objects.create(number=3, campaign=cls.campaign, budget_process=cls.budget_process_2)
        cls.round_4 = Round.objects.create(number=4, campaign=cls.campaign, budget_process=None)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)
        cls.budget_step_2 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)

    def test_create(self):
        """
        POST /api/polio/budget/
        """
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/polio/budget/",
            data={
                "rounds": [{"id": self.round_4.pk}],
            },
            format="json",
        )
        response_data = self.assertJSONResponse(response, 201)
        new_budget_process = BudgetProcess.objects.get(id=response_data["id"])
        self.assertEqual(
            response_data,
            {
                "id": new_budget_process.pk,
                "created_by": {
                    "first_name": "test",
                    "full_name": "test test",
                    "id": self.user.pk,
                    "last_name": "test",
                    "username": "test",
                },
                "created_at": new_budget_process.created_at.isoformat().replace("+00:00", "Z"),
                "rounds": [{"id": self.round_4.pk, "cost": "0.00"}],
                "ra_completed_at_WFEDITABLE": None,
                "who_sent_budget_at_WFEDITABLE": None,
                "unicef_sent_budget_at_WFEDITABLE": None,
                "gpei_consolidated_budgets_at_WFEDITABLE": None,
                "submitted_to_rrt_at_WFEDITABLE": None,
                "feedback_sent_to_gpei_at_WFEDITABLE": None,
                "re_submitted_to_rrt_at_WFEDITABLE": None,
                "submitted_to_orpg_operations1_at_WFEDITABLE": None,
                "feedback_sent_to_rrt1_at_WFEDITABLE": None,
                "re_submitted_to_orpg_operations1_at_WFEDITABLE": None,
                "submitted_to_orpg_wider_at_WFEDITABLE": None,
                "submitted_to_orpg_operations2_at_WFEDITABLE": None,
                "feedback_sent_to_rrt2_at_WFEDITABLE": None,
                "re_submitted_to_orpg_operations2_at_WFEDITABLE": None,
                "submitted_for_approval_at_WFEDITABLE": None,
                "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE": None,
                "feedback_sent_to_orpg_operations_who_at_WFEDITABLE": None,
                "approved_by_who_at_WFEDITABLE": None,
                "approved_by_unicef_at_WFEDITABLE": None,
                "approved_at_WFEDITABLE": None,
                "approval_confirmed_at_WFEDITABLE": None,
                "payment_mode": "",
                "district_count": None,
                "who_disbursed_to_co_at": None,
                "who_disbursed_to_moh_at": None,
                "unicef_disbursed_to_co_at": None,
                "unicef_disbursed_to_moh_at": None,
                "no_regret_fund_amount": None,
            },
        )

    def test_update(self):
        """
        PATCH /api/polio/budget/pk/
        """
        self.client.force_login(self.user)
        self.assertEqual(self.budget_process_1.rounds.count(), 2)
        data = {
            "id": self.budget_process_1.pk,
            "campaign_id": self.campaign.id,
            "obr_name": "test staging",
            "country_name": "BURUNDI",
            "rounds": [{"id": self.round_1.pk, "cost": "5.00"}],
            "current_state": {"key": "-", "label": "No budget submitted"},
            "ra_completed_at_WFEDITABLE": "2026-04-01",
            "who_sent_budget_at_WFEDITABLE": "2026-04-01",
            "unicef_sent_budget_at_WFEDITABLE": "2026-04-01",
            "gpei_consolidated_budgets_at_WFEDITABLE": "2026-04-01",
            "submitted_to_rrt_at_WFEDITABLE": "2026-04-01",
            "feedback_sent_to_gpei_at_WFEDITABLE": "2026-04-01",
            "re_submitted_to_rrt_at_WFEDITABLE": "2026-04-01",
            "submitted_to_orpg_operations1_at_WFEDITABLE": "2026-04-01",
            "feedback_sent_to_rrt1_at_WFEDITABLE": "2026-04-01",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE": "2026-04-01",
            "submitted_to_orpg_wider_at_WFEDITABLE": "2026-04-01",
            "submitted_to_orpg_operations2_at_WFEDITABLE": "2026-04-01",
            "feedback_sent_to_rrt2_at_WFEDITABLE": "2026-04-01",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE": "2026-04-01",
            "submitted_for_approval_at_WFEDITABLE": "2026-04-01",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE": "2026-04-01",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE": "2026-04-01",
            "approved_by_who_at_WFEDITABLE": "2026-04-01",
            "approved_by_unicef_at_WFEDITABLE": "2026-04-01",
            "approved_at_WFEDITABLE": "2026-04-01",
            "approval_confirmed_at_WFEDITABLE": "2026-04-01",
            "payment_mode": "",
            "district_count": None,
            "who_disbursed_to_co_at": None,
            "who_disbursed_to_moh_at": None,
            "unicef_disbursed_to_co_at": None,
            "unicef_disbursed_to_moh_at": None,
            "no_regret_fund_amount": 30.0,
            "has_data_in_budget_tool": False,
        }
        response = self.client.patch(
            f"/api/polio/budget/{self.budget_process_1.pk}/",
            data=data,
            format="json",
        )

        self.budget_process_1.refresh_from_db()
        self.assertEqual(self.budget_process_1.rounds.count(), 1)
        self.assertEqual(self.budget_process_1.ra_completed_at_WFEDITABLE, datetime.date(2026, 4, 1))

        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["id"], self.budget_process_1.pk)
        self.assertEqual(response_data["rounds"], [{"id": self.round_1.pk, "cost": "5.00"}])
        self.assertEqual(response_data["ra_completed_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["who_sent_budget_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["unicef_sent_budget_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["gpei_consolidated_budgets_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["submitted_to_rrt_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["feedback_sent_to_gpei_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["re_submitted_to_rrt_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["submitted_to_orpg_operations1_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["feedback_sent_to_rrt1_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(
            response_data["re_submitted_to_orpg_operations1_at_WFEDITABLE"],
            "2026-04-01",
        )
        self.assertEqual(response_data["submitted_to_orpg_wider_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["submitted_to_orpg_operations2_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["feedback_sent_to_rrt2_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(
            response_data["re_submitted_to_orpg_operations2_at_WFEDITABLE"],
            "2026-04-01",
        )
        self.assertEqual(response_data["submitted_for_approval_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(
            response_data["feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE"],
            "2026-04-01",
        )
        self.assertEqual(
            response_data["feedback_sent_to_orpg_operations_who_at_WFEDITABLE"],
            "2026-04-01",
        )
        self.assertEqual(response_data["approved_by_who_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["approved_by_unicef_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["approved_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["approval_confirmed_at_WFEDITABLE"], "2026-04-01")
        self.assertEqual(response_data["payment_mode"], "")
        self.assertEqual(response_data["district_count"], None)
        self.assertEqual(response_data["who_disbursed_to_co_at"], None)
        self.assertEqual(response_data["who_disbursed_to_moh_at"], None)
        self.assertEqual(response_data["unicef_disbursed_to_co_at"], None)
        self.assertEqual(response_data["unicef_disbursed_to_moh_at"], None)
        self.assertEqual(response_data["no_regret_fund_amount"], "30.00")

    def test_soft_delete(self):
        """
        DELETE /api/polio/budget/pk/
        """
        # Before soft delete.
        self.assertIsNone(self.budget_process_1.deleted_at)
        for step in self.budget_process_1.budget_steps.all():
            self.assertIsNone(step.deleted_at)
        for round in self.budget_process_1.rounds.all():
            self.assertIsNotNone(round.budget_process)

        # Delete.
        self.client.force_login(self.user)
        response = self.client.delete(f"/api/polio/budget/{self.budget_process_1.id}/", format="json")
        self.assertEqual(response.status_code, 204)

        # After soft delete.
        self.budget_process_1.refresh_from_db()
        self.assertIsNotNone(self.budget_process_1.deleted_at)
        for step in self.budget_process_1.budget_steps.all():
            self.assertIsNotNone(step.deleted_at)
        for round in self.budget_process_1.rounds.all():
            self.assertIsNone(round.budget_process)

    def test_simple_get_list(self):
        """
        GET /api/polio/budget/
        """
        self.client.force_login(self.user)

        with self.assertNumQueries(9):
            response = self.client.get("/api/polio/budget/")
            response_data = self.assertJSONResponse(response, 200)

        budget_processes = response_data["results"]
        for budget_process in budget_processes:
            self.assertEqual(len(budget_process.keys()), 8)
            self.assertIn("created_at", budget_process)
            self.assertIn("updated_at", budget_process)
            self.assertIn("id", budget_process)
            self.assertEqual(budget_process["campaign_id"], str(self.campaign.id))
            self.assertEqual(budget_process["obr_name"], "test campaign")
            self.assertEqual(budget_process["country_name"], "ANGOLA")
            self.assertEqual(budget_process["current_state"], {"key": "-", "label": "-"})
            self.assertIn("rounds", budget_process)

        self.assertEqual(
            budget_processes[0]["rounds"],
            [
                {
                    "id": self.round_1.pk,
                    "number": 1,
                    "cost": "0.00",
                    "target_population": None,
                },
                {
                    "id": self.round_2.pk,
                    "number": 2,
                    "cost": "0.00",
                    "target_population": None,
                },
            ],
        )
        self.assertEqual(
            budget_processes[1]["rounds"],
            [
                {
                    "id": self.round_3.pk,
                    "number": 3,
                    "cost": "0.00",
                    "target_population": None,
                }
            ],
        )

    def test_simple_get_list_with_all_fields(self):
        """
        GET /api/polio/budget/?fields=:all
        """
        self.client.force_login(self.user)
        response = self.client.get("/api/polio/budget/?fields=:all")
        response_data = self.assertJSONResponse(response, 200)

        for budget_process in response_data["results"]:
            self.assertEqual(len(budget_process.keys()), 41)

    def test_list_select_fields(self):
        """
        GET /api/polio/budget/?fields=obr_name,country_name
        """
        self.client.force_login(self.user)
        response = self.client.get("/api/polio/budget/?fields=obr_name,country_name")
        response_data = self.assertJSONResponse(response, 200)
        for budget_process in response_data["results"]:
            self.assertEqual(budget_process["obr_name"], "test campaign")
            self.assertEqual(budget_process["country_name"], "ANGOLA")
            self.assertEqual(list(budget_process.keys()), ["obr_name", "country_name"])

    def test_transition_to(self):
        """
        POST /api/polio/budget/transition_to/
        Transition to `budget_submitted`.
        """
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "budget_process": self.budget_process_1.id,
                "comment": "hello world2",
                "files": [],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)
        self.assertEqual(budget_step.files.count(), 0)
        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)

        budget_process = BudgetProcess.objects.get(id=budget_step.budget_process.pk)
        self.assertEqual(budget_process.current_state_key, "budget_submitted")
        self.assertEqual(budget_process.current_state_label, "Budget submitted")

    def test_transition_to_with_files(self):
        """
        POST /api/polio/budget/transition_to/
        Transition to `budget_submitted` with files.
        """
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "budget_process": self.budget_process_1.id,
                "comment": "hello world2",
                "files": [fake_file],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)
        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)

        self.assertEqual(budget_step.files.count(), 1)
        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # Should be an url.
        self.assertEqual(file["filename"], fake_file.name)

        file_id = budget_step.files.first().id
        self.assertEqual(file["id"], file_id)
        self.assertEqual(
            file["permanent_url"],
            f"/api/polio/budgetsteps/{budget_step.id}/files/{file_id}/",
        )

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/files/{file_id}/")
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND, response)
        self.assertTrue(len(response.url) > 0)

    def test_transition_to_with_files_and_link(self):
        """
        POST /api/polio/budget/transition_to/
        Transition to `budget_submitted` with files and link.
        """
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "budget_process": self.budget_process_1.id,
                "comment": "hello world2",
                "files": [fake_file],
                "links": json.dumps(
                    [
                        {
                            "url": "http://helloworld",
                            "alias": "hello world",
                        },
                        {
                            "alias": "mon petit lien",
                            "url": "https://lien.com",
                        },
                    ]
                ),
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)
        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round_1.budget_process
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["current_state"]["key"], "budget_submitted")
        self.assertEqual(
            response_data["updated_at"],
            budget_process.updated_at.isoformat().replace("+00:00", "Z"),
        )

        self.assertEqual(budget_step.files.count(), 1)

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # Should be an url.
        self.assertEqual(file["filename"], fake_file.name)

        links = response_data["links"]
        self.jsonListContains(
            links,
            [
                {"url": "http://helloworld", "alias": "hello world"},
                {"alias": "mon petit lien", "url": "https://lien.com"},
            ],
        )

    def test_transition_to_with_link_in_json(self):
        """
        POST /api/polio/budget/transition_to/
        Transition to `budget_submitted` with link in JSON format.
        """
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "budget_process": self.budget_process_1.id,
                "comment": "hello world2",
                "links": [
                    {
                        "url": "http://helloworld",
                        "alias": "hello world",
                    },
                    {
                        "alias": "mon petit lien",
                        "url": "https://lien.com",
                    },
                ],
            },
            format="json",
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)
        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round_1.budget_process
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["current_state"]["key"], "budget_submitted")
        self.assertEqual(
            response_data["updated_at"],
            budget_process.updated_at.isoformat().replace("+00:00", "Z"),
        )

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)

        links = response_data["links"]
        self.jsonListContains(
            links,
            [
                {"url": "http://helloworld", "alias": "hello world"},
                {"alias": "mon petit lien", "url": "https://lien.com"},
            ],
        )

    def test_next_steps_after_transition(self):
        """
        Do `POST /api/polio/budget/transition_to/` twice.
        """
        budget_process = self.budget_process_2
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        # First transition.
        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "budget_process": budget_process.id,
                "comment": "hello world2",
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        budget_step_1 = BudgetStep.objects.get(id=response_data["id"])

        # Check created `BudgetStep`.
        self.assertEqual(budget_step_1.campaign, self.campaign)
        self.assertEqual(budget_step_1.budget_process, budget_process)
        self.assertEqual(budget_step_1.transition_key, "submit_budget")
        self.assertEqual(budget_step_1.node_key_from, "-")
        self.assertEqual(budget_step_1.node_key_to, "budget_submitted")
        self.assertEqual(budget_step_1.created_by, self.user)
        self.assertEqual(budget_step_1.comment, "hello world2")
        self.assertIsNone(budget_step_1.amount)

        # Check steps number.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)
        # Check new `BudgetProcess` status.
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/?fields=:all")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["current_state"]["key"], "budget_submitted")

        # Second transition.
        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "accept_budget",
                "budget_process": budget_process.id,
                "comment": "I'm accepting the budget",
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")
        budget_step_2 = BudgetStep.objects.get(id=response_data["id"])
        # Check steps number.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 2, new_budget_step_count)
        # Check `BudgetProcess`.
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/?fields=:all")
        response_data = self.assertJSONResponse(response, 200)
        budget_process = response_data
        self.assertEqual(budget_process["current_state"]["key"], "accepted")
        self.assertEqual(budget_process["obr_name"], "test campaign")
        self.assertEqual(budget_process["current_state"]["key"], "accepted")
        self.assertTrue(isinstance(budget_process["updated_at"], str) and len(budget_process["updated_at"]) > 0)
        self.assertTrue(isinstance(budget_process["next_transitions"], list))
        # Final transition there is none after.
        self.assertEqual(len(response_data["next_transitions"]), 0)
        # Check timeline.
        expected_timeline = {
            "categories": [
                {
                    "key": "category_1",
                    "label": "Category 1",
                    "color": "green",
                    "items": [
                        {
                            "label": "Budget submitted",
                            "performed_by": {
                                "first_name": "test",
                                "full_name": "test test",
                                "id": self.user.pk,
                                "last_name": "test",
                                "username": "test",
                            },
                            "performed_at": budget_step_1.created_at.isoformat().replace("+00:00", "Z"),
                            "step_id": budget_step_1.pk,
                        }
                    ],
                    "completed": True,
                    "active": False,
                },
                {
                    "key": "category_2",
                    "label": "Category 2",
                    "color": "green",
                    "items": [
                        {
                            "label": "Budget accepted",
                            "performed_by": {
                                "first_name": "test",
                                "full_name": "test test",
                                "id": self.user.pk,
                                "last_name": "test",
                                "username": "test",
                            },
                            "performed_at": budget_step_2.created_at.isoformat().replace("+00:00", "Z"),
                            "step_id": budget_step_2.pk,
                        }
                    ],
                    "completed": True,
                    "active": False,
                },
            ]
        }
        self.assertEqual(budget_process["timeline"], expected_timeline)

    def test_transition_override_to(self):
        """
        POST /api/polio/budget/override/
        Force state to `rejected`.
        """
        self.user.user_permissions.add(Permission.objects.get(codename="iaso_polio_budget_admin"))
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/override/",
            data={
                "new_state_key": "rejected",
                "budget_process": self.budget_process_1.id,
                "comment": "override me",
                "files": [fake_file],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)

        # Check created `BudgetStep`.
        self.assertEqual(budget_step.campaign, self.campaign)
        self.assertEqual(budget_step.budget_process, self.budget_process_1)
        self.assertEqual(budget_step.transition_key, "override")
        self.assertEqual(budget_step.node_key_from, "-")
        self.assertEqual(budget_step.node_key_to, "rejected")
        self.assertEqual(budget_step.created_by, self.user)
        self.assertEqual(budget_step.comment, "override me")
        self.assertIsNone(budget_step.amount)

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round_1.budget_process
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["current_state"]["key"], "rejected")
        self.assertEqual(
            response_data["updated_at"],
            budget_process.updated_at.isoformat().replace("+00:00", "Z"),
        )

        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(budget_step.files.count(), 1)

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # Should be an url.
        self.assertEqual(file["filename"], fake_file.name)

    def test_mail_template_init(self):
        text = """
        hello, {{user}}
        """
        mt = MailTemplate(slug="hello", text_template=text, html_template=text, subject_template="hey")
        mt.full_clean()
        mt.save()
        template = Engine.get_default().from_string(mt.text_template)
        context = Context({"user": "olivier"})
        r = template.render(context)
        self.assertEqual(
            r,
            """
        hello, olivier
        """,
        )

    def test_mail_template_invalid(self):
        text = """
        hello, {{user:dwadwa}}
        """
        mt = MailTemplate(slug="hello", html_template=text, text_template=text, subject_template="hey")
        with self.assertRaises(ValidationError):
            mt.full_clean()
            mt.save()

    @skip("for debug")
    def test_mail_template_include(self):
        # Just to check if include works inside string template
        text = """  hello, {{user}}
        
    {%include "_files.html" with files=files only %}
    {%include "_links.html" with links=links only %}
        """
        mt = MailTemplate(slug="hello", template=text, subject_template="hey")
        mt.full_clean()
        mt.save()
        template = Engine.get_default().from_string(mt.template)
        context = Context(
            {
                "user": "olivier",
                "files": [{"path": "http://example.com/test.txt", "name": "test.txt"}],
            }
        )
        r = template.render(context)
        self.assertEqual(
            r,
            """
        hello, olivier
        """,
        )

    def test_csv_export(self):
        self.client.force_login(self.user)
        r = self.client.get("/api/polio/budget/export_csv/?fields=obr_name,rounds")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/csv")
        self.assertEqual(r.content, b'OBR name,Rounds\r\ntest campaign,"1,2"\r\ntest campaign,3\r\n')

    def test_csv_export_date(self):
        self.client.force_login(self.user)
        budget_step = BudgetStep.objects.create(
            budget_process=self.budget_process_1,
            transition_key="submit_budget",
            node_key_to="budget_submitted",
            created_by=self.user,
        )
        response = self.client.get("/api/polio/budget/export_csv/?fields=updated_at")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        d = budget_step.created_at.strftime("%Y-%m-%d")
        self.assertEqual(response.content.decode(), f"Last update\r\n{d}\r\n{d}\r\n")

    def test_available_rounds_for_update(self):
        """
        GET /api/polio/budget/available_rounds_for_update/?campaign_id=uuid&budget_process_id=pk
        """
        self.client.force_login(self.user)

        response = self.client.get(
            "/api/polio/budget/available_rounds_for_update/"
            f"?campaign_id={self.campaign.id}&budget_process_id={self.budget_process_1.pk}"
        )
        response_data = self.assertJSONResponse(response, 200)

        expected_data = [
            {
                "value": self.round_1.pk,
                "label": 1,
                "on_hold": False,
                "campaign_id": str(self.campaign.id),
                "target_population": None,
            },
            {
                "value": self.round_2.pk,
                "label": 2,
                "on_hold": False,
                "campaign_id": str(self.campaign.id),
                "target_population": None,
            },
            {
                "value": self.round_4.pk,
                "label": 4,
                "on_hold": False,
                "campaign_id": str(self.campaign.id),
                "target_population": None,
            },
        ]
        self.assertEqual(response_data, expected_data)

    def test_available_rounds_for_create(self):
        """
        GET /api/polio/budget/available_rounds_for_create/
        """
        self.client.force_login(self.user)

        response = self.client.get("/api/polio/budget/available_rounds_for_create/")
        response_data = self.assertJSONResponse(response, 200)

        expected_data = {
            "countries": [{"value": self.campaign.country.id, "label": "ANGOLA"}],
            "campaigns": [
                {
                    "value": str(self.campaign.id),
                    "label": "test campaign",
                    "country_id": self.campaign.country.id,
                }
            ],
            "rounds": [
                # Only round 4 should be available.
                {
                    "value": self.round_4.id,
                    "label": 4,
                    "on_hold": False,
                    "campaign_id": str(self.campaign.id),
                    "target_population": None,
                },
            ],
        }
        self.assertEqual(response_data, expected_data)


class FilterBudgetProcessViewSetTestCase(APITestCase):
    """
    Test filtering on `BudgetProcessViewSet`.
    """

    @classmethod
    def setUpTestData(cls) -> None:
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account, permissions=["iaso_polio_budget"])

        # Campaign type.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)

        # Campaign.
        cls.country = m.OrgUnit.objects.create(name="ANGOLA")
        cls.campaign = Campaign.objects.create(
            obr_name="test campaign",
            account=cls.user.iaso_profile.account,
            country=cls.country,
        )
        cls.campaign.campaign_types.set([cls.polio_type])

        # Budget Processes.
        cls.budget_process_1 = BudgetProcess.objects.create(created_by=cls.user)
        cls.budget_process_2 = BudgetProcess.objects.create(created_by=cls.user)

        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_3 = Round.objects.create(number=3, campaign=cls.campaign, budget_process=cls.budget_process_2)
        cls.round_4 = Round.objects.create(number=4, campaign=cls.campaign, budget_process=None)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)
        cls.budget_step_2 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)

    def test_list_filter_by_org_unit_groups(self):
        """
        GET /api/polio/budget/?org_unit_groups=x,y
        """
        group_1 = m.Group.objects.create(name="Group 1")
        group_2 = m.Group.objects.create(name="Group 2")
        self.campaign.country.groups.set([group_1])
        self.client.force_login(self.user)

        response = self.client.get(f"/api/polio/budget/?org_unit_groups={group_1.id},{group_2.id}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)

        response = self.client.get(f"/api/polio/budget/?org_unit_groups={group_2.id}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)

    def test_list_filter_by_countries(self):
        """
        GET /api/polio/budget/?countries=x,y
        """
        self.client.force_login(self.user)
        response = self.client.get(f"/api/polio/budget/?countries={self.country.pk}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)

        not_existing_country_id = self.country.pk + 1
        response = self.client.get(f"/api/polio/budget/?countries={not_existing_country_id}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)

    def test_list_filter_by_search(self):
        """
        GET /api/polio/budget/?search=foo
        """
        self.client.force_login(self.user)

        search = self.campaign.obr_name
        response = self.client.get(f"/api/polio/budget/?search={search}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)

        search = self.country.name
        response = self.client.get(f"/api/polio/budget/?search={search}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)

        search = "foo"
        response = self.client.get(f"/api/polio/budget/?search={search}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)

    def test_list_filter_by_current_state_key(self):
        """
        GET /api/polio/budget/?current_state_key=key
        """
        self.client.force_login(self.user)

        current_state_key = "foo"
        response = self.client.get(f"/api/polio/budget/?current_state_key={current_state_key}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)

        current_state_key = self.budget_process_1.current_state_key
        response = self.client.get(f"/api/polio/budget/?current_state_key={current_state_key}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)


@mock.patch("plugins.polio.budget.models.get_workflow", get_mocked_workflow)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_mocked_workflow)
class FilterBudgetStepViewSetTestCase(APITestCase):
    """
    Test filtering on `BudgetStepViewSet`.
    """

    @classmethod
    def setUpTestData(cls) -> None:
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account, permissions=["iaso_polio_budget"])

        # Campaign.
        cls.country = m.OrgUnit.objects.create(name="ANGOLA")
        cls.campaign = Campaign.objects.create(
            obr_name="test campaign",
            account=cls.user.iaso_profile.account,
            country=cls.country,
        )

        # Budget Processes.
        cls.budget_process_1 = BudgetProcess.objects.create(created_by=cls.user)
        cls.budget_process_2 = BudgetProcess.objects.create(created_by=cls.user)

        # # Rounds.
        cls.round_a = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_b = Round.objects.create(number=2, campaign=cls.campaign, budget_process=cls.budget_process_1)
        cls.round_c = Round.objects.create(number=1, campaign=cls.campaign, budget_process=cls.budget_process_2)

        # Budget Steps.
        cls.budget_step_1 = BudgetStep.objects.create(
            budget_process=cls.budget_process_1,
            created_by=cls.user,
            transition_key="submit_budget",
        )
        cls.budget_step_2 = BudgetStep.objects.create(budget_process=cls.budget_process_1, created_by=cls.user)

    def test_list_filter_by_budget_process_id(self):
        """
        GET /api/polio/budgetsteps/?budget_process_id=x
        """
        self.client.force_login(self.user)

        self.assertEqual(self.budget_process_1.budget_steps.count(), 2)
        self.assertEqual(self.budget_process_2.budget_steps.count(), 0)

        response = self.client.get(f"/api/polio/budgetsteps/?budget_process_id={self.budget_process_1.id}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 2)

        response = self.client.get(f"/api/polio/budgetsteps/?budget_process_id={self.budget_process_2.id}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)

    def test_list_filter_by_transition_key(self):
        """
        GET /api/polio/budgetsteps/?transition_key=x
        """
        self.client.force_login(self.user)

        id_ = self.budget_process_1.id
        key = "submit_budget"
        response = self.client.get(f"/api/polio/budgetsteps/?budget_process_id={id_}&transition_key={key}")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 1)
