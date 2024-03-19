import json
from io import StringIO
from typing import List, Dict
from unittest import skip, mock

from django.contrib.auth.models import User, Permission
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.template import Engine, Context
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep, MailTemplate
from plugins.polio.budget.workflow import Category, Transition, Node, Workflow
from plugins.polio.models import Campaign, Round

# Hardcoded workflow for testing.

transition_defs = [
    {
        "displayed_fields": ["comment"],
        "from_node": "-",
        "key": "submit_budget",
        "label": "Submit budget",
        "required_fields": [],
        "teams_ids_can_transition": [],
        "to_node": "budget_submitted",
    },
    {
        "color": "green",
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "key": "accept_budget",
        "label": "Accept budget",
        "required_fields": [],
        "to_node": "accepted",
    },
    {
        "color": "primary",
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "key": "reject_budget",
        "label": "Provide feedback",
        "required_fields": [],
        "to_node": "rejected",
    },
    {
        "color": "red",
        "displayed_fields": [],
        "emails_to_send": [],
        "from_node": "any",
        "key": "override",
        "label": "Override",
        "required_fields": [],
        "teams_ids_can_transition": [],
        "to_node": "any",
    },
]

node_defs = [
    {"key": None, "label": "No budget", "category_key": "category_1"},
    {"key": "budget_submitted", "label": "Budget submitted", "category_key": "category_1"},
    {"key": "accepted", "label": "Budget accepted", "category_key": "category_2"},
    {"key": "rejected", "label": "Budget rejected", "category_key": "category_2"},
]

categories_defs = [
    {"key": "category_1", "label": "Category 1"},
    {"key": "category_2", "label": "Category 2"},
]


def get_workflow():
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    categories = [Category(**categories_def) for categories_def in categories_defs]
    return Workflow(transitions=transitions, nodes=nodes, categories=categories)


@mock.patch("plugins.polio.budget.models.get_workflow", get_workflow)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_workflow)
class BudgetCampaignViewSetTestCase(APITestCase):
    """
    Test actions on `BudgetCampaignViewSet`.
    """

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
            self.assertTrue(any(dictContains(actual_d, d) for actual_d in actual), f"{d} not found in {actual}")

    @classmethod
    def setUpTestData(cls) -> None:
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            username="test", first_name="test", last_name="test", account=cls.account, permissions=["iaso_polio_budget"]
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(
            obr_name="test campaign",
            account=cls.user.iaso_profile.account,
            country=m.OrgUnit.objects.create(name="ANGOLA"),
        )

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
                "rounds": [self.round_4.pk],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        new_budget_process = BudgetProcess.objects.get(id=response_data["id"])
        self.assertEqual(
            response_data,
            {
                "id": new_budget_process.pk,
                "created_by": {"first_name": "test", "last_name": "test", "username": "test"},
                "created_at": new_budget_process.created_at.isoformat().replace("+00:00", "Z"),
                "rounds": [self.round_4.pk],
            },
        )

    def test_simple_get_list(self):
        """
        GET /api/polio/budget/
        """
        self.client.force_login(self.user)

        with self.assertNumQueries(8):
            response = self.client.get("/api/polio/budget/")
            response_data = self.assertJSONResponse(response, 200)

        budget_processes = response_data["results"]
        for budget_process in budget_processes:
            self.assertEqual(len(budget_process.keys()), 7)
            self.assertIn("created_at", budget_process)
            self.assertIn("updated_at", budget_process)
            self.assertIn("id", budget_process)
            self.assertEqual(budget_process["obr_name"], "test campaign")
            self.assertEqual(budget_process["country_name"], "ANGOLA")
            self.assertEqual(budget_process["current_state"], {"key": "-", "label": "-"})
            self.assertIn("round_numbers", budget_process)

        self.assertEqual(budget_processes[0]["round_numbers"], [1, 2])
        self.assertEqual(budget_processes[1]["round_numbers"], [3])

    def test_simple_get_list_with_all_fields(self):
        """
        GET /api/polio/budget/?fields=:all
        """
        self.client.force_login(self.user)
        response = self.client.get("/api/polio/budget/?fields=:all")
        response_data = self.assertJSONResponse(response, 200)

        expected_possible_states = [
            {"key": None, "label": "No budget"},
            {"key": "budget_submitted", "label": "Budget submitted"},
            {"key": "accepted", "label": "Budget accepted"},
            {"key": "rejected", "label": "Budget rejected"},
        ]
        expected_next_transitions = [
            {
                "key": "submit_budget",
                "label": "Submit budget",
                "help_text": "",
                "allowed": True,
                "reason_not_allowed": None,
                "required_fields": [],
                "displayed_fields": ["comment"],
                "color": None,
                "emails_destination_team_ids": [],
            }
        ]
        expected_possible_transitions = [
            {
                "key": "submit_budget",
                "label": "Submit budget",
                "help_text": "",
                "allowed": None,
                "reason_not_allowed": None,
                "required_fields": [],
                "displayed_fields": ["comment"],
                "color": None,
            },
            {
                "key": "accept_budget",
                "label": "Accept budget",
                "help_text": "",
                "allowed": None,
                "reason_not_allowed": None,
                "required_fields": [],
                "displayed_fields": ["comment"],
                "color": "green",
            },
            {
                "key": "reject_budget",
                "label": "Provide feedback",
                "help_text": "",
                "allowed": None,
                "reason_not_allowed": None,
                "required_fields": [],
                "displayed_fields": ["comment"],
                "color": "primary",
            },
            {
                "key": "override",
                "label": "Override",
                "help_text": "",
                "allowed": None,
                "reason_not_allowed": None,
                "required_fields": [],
                "displayed_fields": [],
                "color": "red",
            },
        ]
        expected_timeline = {
            "categories": [
                {
                    "key": "category_1",
                    "label": "Category 1",
                    "color": "green",
                    "items": [],
                    "completed": True,
                    "active": False,
                },
                {
                    "key": "category_2",
                    "label": "Category 2",
                    "color": "green",
                    "items": [],
                    "completed": True,
                    "active": False,
                },
            ]
        }
        for budget_process in response_data["results"]:
            self.assertEqual(len(budget_process.keys()), 11)
            self.assertIn("created_at", budget_process)
            self.assertIn("updated_at", budget_process)
            self.assertIn("id", budget_process)
            self.assertEqual(budget_process["obr_name"], "test campaign")
            self.assertEqual(budget_process["country_name"], "ANGOLA")
            self.assertEqual(budget_process["current_state"], {"key": "-", "label": "-"})
            self.assertEqual(budget_process["possible_states"], expected_possible_states)
            self.assertEqual(budget_process["next_transitions"], expected_next_transitions)
            self.assertEqual(budget_process["possible_transitions"], expected_possible_transitions)
            self.assertEqual(budget_process["timeline"], expected_timeline)
            self.assertIn("round_numbers", budget_process)

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
        self.assertEqual(file["permanent_url"], f"/api/polio/budgetsteps/{budget_step.id}/files/{file_id}/")

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
        self.assertEqual(response_data["updated_at"], budget_process.updated_at.isoformat().replace("+00:00", "Z"))

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
        self.assertEqual(response_data["updated_at"], budget_process.updated_at.isoformat().replace("+00:00", "Z"))

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
                            "performed_by": {"first_name": "test", "last_name": "test", "username": "test"},
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
                            "performed_by": {"first_name": "test", "last_name": "test", "username": "test"},
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
        self.assertEqual(budget_step.transition_key, "override")
        self.assertEqual(budget_step.node_key_from, "-")
        self.assertEqual(budget_step.node_key_to, "rejected")

        # Check DB relations: BudgetStep -> BudgetProcess <- Round
        self.round_1.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round_1.budget_process)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round_1.budget_process
        response = self.client.get(f"/api/polio/budget/{budget_process.id}/")
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["current_state"]["key"], "rejected")
        self.assertEqual(response_data["updated_at"], budget_process.updated_at.isoformat().replace("+00:00", "Z"))

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
        context = Context({"user": "olivier", "files": [{"path": "http://example.com/test.txt", "name": "test.txt"}]})
        r = template.render(context)
        self.assertEqual(
            r,
            """
        hello, olivier
        """,
        )

    def test_csv_export(self):
        self.client.force_login(self.user)
        r = self.client.get("/api/polio/budget/export_csv/?fields=obr_name")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/csv")
        self.assertEqual(r.content, b"OBR name\r\ntest campaign\r\ntest campaign\r\n")

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

    def test_new_budget_process_dropdowns(self):
        """
        GET /api/polio/budget/new_budget_process_dropdowns/
        """
        self.client.force_login(self.user)

        response = self.client.get("/api/polio/budget/new_budget_process_dropdowns/")
        response_data = self.assertJSONResponse(response, 200)

        expected_data = {
            "countries": [{"id": self.campaign.country.id, "name": "ANGOLA"}],
            "campaigns": [
                {"id": str(self.campaign.id), "name": "test campaign", "country_id": self.campaign.country.id}
            ],
            "rounds": [
                # Only round 4 should be available.
                {"id": self.round_4.id, "name": 4, "campaign_id": str(self.campaign.id)},
            ],
        }
        self.assertEqual(response_data, expected_data)


class FilterBudgetCampaignViewSetTestCase(APITestCase):
    """
    Test filtering on `BudgetCampaignViewSet`.
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


@mock.patch("plugins.polio.budget.models.get_workflow", get_workflow)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_workflow)
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
            budget_process=cls.budget_process_1, created_by=cls.user, transition_key="submit_budget"
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
