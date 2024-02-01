import json
from io import StringIO
from typing import List, Dict
from unittest import skip, mock

from django.contrib.auth.models import User, Permission
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.template import Engine, Context
from rest_framework import status

from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetProcess, BudgetStep, MailTemplate
from plugins.polio.budget.workflow import Transition, Node, Workflow
from plugins.polio.models import Campaign, Round

# Hardcoded workflow for testing.

transition_defs = [
    {
        "key": "submit_budget",
        "label": "Submit budget",
        # "required_fields": ["files"],
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "-",
        "to_node": "budget_submitted",
        "teams_ids_can_transition": [],
    },
    {
        "key": "accept_budget",
        "label": "Accept budget",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "to_node": "accepted",
        "color": "green",
    },
    {
        "key": "reject_budget",
        "label": "Provide feedback",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "to_node": "rejected",
        "color": "primary",
    },
]

node_defs = [
    {"key": None, "label": "No budget"},
    {"key": "budget_submitted", "label": "Budget submitted"},
    {"key": "accepted", "label": "Budget accepted"},
    {"key": "rejected", "label": "Budget rejected"},
]


def get_workflow():
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    return Workflow(transitions=transitions, nodes=nodes, categories=[])


@mock.patch("plugins.polio.budget.models.get_workflow", get_workflow)
@mock.patch("plugins.polio.budget.serializers.get_workflow", get_workflow)
class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]
    c: Campaign
    user: User

    def jsonListContains(self, actual: List[Dict], expected: List[Dict]):
        "Check that each dict in the expect list is contained as a subset of a dict in actual"

        def dictContains(actual_d, expected_d):
            for k, v in expected_d.items():
                if not actual_d[k] == v:
                    return False
            return True

        for d in expected:
            self.assertTrue(any(dictContains(actual_d, d) for actual_d in actual), f"{d} not found in {actual}")

    @classmethod
    def setUpTestData(cls) -> None:
        cls.user = User.objects.get(username="test")
        cls.user.user_permissions.add(Permission.objects.get(codename="iaso_polio_budget"))

        cls.campaign = Campaign.objects.create(obr_name="test campaign", account=cls.user.iaso_profile.account)
        cls.round = Round.objects.create(number=1, campaign=cls.campaign)

    def test_simple_get_list(self):
        self.client.force_login(self.user)

        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

    def test_list_select_fields(self):
        self.client.force_login(self.user)

        r = self.client.get("/api/polio/budget/?fields=obr_name,country_name")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")
            self.assertEqual(c["country_name"], None)
            self.assertEqual(list(c.keys()), ["obr_name", "country_name"])

    def test_transition_to(self):
        """With file and links."""
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        response = self.client.get("/api/polio/budget/")
        response_data = self.assertJSONResponse(response, 200)

        campaigns = response_data["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "round": self.round.id,
                "comment": "hello world2",
                "files": [fake_file],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)

        # Check the relations: BudgetStep ----> BudgetProcess <---- Round
        self.round.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round.budget_process)

        budget_process = BudgetProcess.objects.get(id=budget_step.budget_process.pk)
        self.assertEqual(budget_process.current_state_key, "budget_submitted")
        self.assertEqual(budget_process.current_state_label, "Budget submitted")

        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(budget_step.files.count(), 1)
        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # should be an url
        self.assertEqual(file["filename"], fake_file.name)

    def test_step_files(self):
        """With file and links."""
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        response = self.client.get("/api/polio/budget/")
        response_data = self.assertJSONResponse(response, 200)

        campaigns = response_data["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "round": self.round.id,
                "comment": "hello world2",
                "files": [fake_file],
            },
        )
        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(response_data["result"], "success")

        step_id = response_data["id"]
        budget_step = BudgetStep.objects.get(id=step_id)

        # Check the relations: BudgetStep ----> BudgetProcess <---- Round
        self.round.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round.budget_process)

        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(budget_step.files.count(), 1)
        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # should be an url
        self.assertEqual(file["filename"], fake_file.name)

        file_id = budget_step.files.first().id
        self.assertEqual(file["id"], file_id)
        self.assertEqual(file["permanent_url"], f"/api/polio/budgetsteps/{budget_step.id}/files/{file_id}/")

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/files/{file_id}/")
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND, response)
        self.assertTrue(len(response.url) > 0)

    def test_transition_to_link(self):
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        response = self.client.get("/api/polio/budget/")
        response_data = self.assertJSONResponse(response, 200)

        campaigns = response_data["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "round": self.round.id,
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

        # Check the relations: BudgetStep ----> BudgetProcess <---- Round
        self.round.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round.budget_process)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round.budget_process
        budget_process.refresh_from_db()
        self.assertEqual(budget_process.current_state_key, "budget_submitted")

        # TODO: current state has been moved in `Budget`, what should we do with `/api/polio/budget/{self.campaign.id}/`
        # response = self.client.get(f"/api/polio/budget/{self.campaign.id}/")
        # response_data = self.assertJSONResponse(response, 200)
        # self.assertEqual(response_data["current_state"]["key"], "budget_submitted")
        # self.assertEqual(response_data['budget_last_updated_at'], s.created_at.isoformat())

        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(budget_step.files.count(), 1)

        response = self.client.get(f"/api/polio/budgetsteps/{budget_step.id}/")
        response_data = self.assertJSONResponse(response, 200)
        file = response_data["files"][0]
        self.assertTrue(file["file"].startswith("http"))  # should be an url
        self.assertEqual(file["filename"], fake_file.name)

        links = response_data["links"]
        self.jsonListContains(
            links,
            [
                {"url": "http://helloworld", "alias": "hello world"},
                {"alias": "mon petit lien", "url": "https://lien.com"},
            ],
        )

    def test_transition_to_link_json(self):
        # check it work when sending json too
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        response = self.client.get("/api/polio/budget/")
        response_data = self.assertJSONResponse(response, 200)

        campaigns = response_data["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        response = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "round": self.round.id,
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

        # Check the relations: BudgetStep ----> BudgetProcess <---- Round
        self.round.refresh_from_db()
        self.assertEqual(budget_step.budget_process, self.round.budget_process)

        # Check the new state of `BudgetProcess`.
        budget_process = self.round.budget_process
        budget_process.refresh_from_db()
        self.assertEqual(budget_process.current_state_key, "budget_submitted")

        # TODO: current state has been moved in `Budget`, what should we do with `/api/polio/budget/{self.campaign.id}/`
        # response = self.client.get(f"/api/polio/budget/{self.campaign.id}/")
        # response_data = self.assertJSONResponse(response, 200)
        # self.assertEqual(response_data["current_state"]["key"], "budget_submitted")
        # self.assertEqual(response_data['budget_last_updated_at'], s.created_at.isoformat())

        # Check that we have only created one step.
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

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
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        c = self.campaign
        r = self.client.get(f"/api/polio/budget/{c.id}/?fields=:all")
        j = self.assertJSONResponse(r, 200)

        # check initial status and possible transition on campaign
        self.assertEqual(j["obr_name"], "test campaign")
        self.assertEqual(j["current_state"]["key"], "-")
        self.assertTrue(isinstance(j["next_transitions"], list))
        transitions = j["next_transitions"]
        self.assertEqual(len(transitions), 1)
        self.assertEqual(transitions[0]["key"], "submit_budget")
        self.assertEqual(transitions[0]["allowed"], True)

        # Post to change status
        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "campaign": self.campaign.id,
                "comment": "hello world2",
            },
        )
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        step_id = j["id"]

        # Check new status on campaign
        r = self.client.get(f"/api/polio/budget/{c.id}/?fields=:all")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["obr_name"], "test campaign")
        self.assertEqual(j["current_state"]["key"], "budget_submitted")
        self.assertTrue(isinstance(j["budget_last_updated_at"], str) and len(j["budget_last_updated_at"]) > 0)
        self.assertTrue(isinstance(j["next_transitions"], list))
        transitions = j["next_transitions"]
        self.assertEqual(len(transitions), 2)
        self.jsonListContains(
            transitions,
            [
                {
                    "key": "accept_budget",
                    "allowed": True,
                },
                {
                    "key": "reject_budget",
                    "allowed": True,
                },
            ],
        )
        # do a second transition
        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "accept_budget",
                "campaign": self.campaign.id,
                "comment": "I'm accepting the budget",
            },
        )
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 2, new_budget_step_count)

        # Check new status on campaign
        r = self.client.get(f"/api/polio/budget/{c.id}/?fields=:all")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["obr_name"], "test campaign")
        self.assertEqual(j["current_state"]["key"], "accepted")
        self.assertTrue(isinstance(j["budget_last_updated_at"], str) and len(j["budget_last_updated_at"]) > 0)
        self.assertTrue(isinstance(j["next_transitions"], list))

        # Final transition there is none after
        self.assertEqual(len(j["next_transitions"]), 0)

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
        print(r)
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
        self.assertEqual(r.content, b"OBR name\r\ntest campaign\r\n")

    def test_csv_export_date(self):
        self.client.force_login(self.user)
        bs = BudgetStep.objects.create(
            campaign=self.campaign,
            transition_key="submit_budget",
            node_key_to="budget_submitted",
            created_by=self.user,
        )
        r = self.client.get("/api/polio/budget/export_csv/?fields=budget_last_updated_at")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/csv")
        d = bs.created_at.strftime("%Y-%m-%d")
        self.assertEqual(r.content.decode(), f"Last update\r\n{d}\r\n")
