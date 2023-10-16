import json
from io import StringIO
from typing import List, Dict
from unittest import skip, mock

from django.contrib.auth.models import User, Permission
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.template import Engine, Context
from rest_framework import status

from iaso.models import Team, Account
from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetStep, MailTemplate, BudgetProcess
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

        cls.c = Campaign.objects.create(obr_name="test campaign", account=cls.user.iaso_profile.account)

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
        "With file and links"
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"
        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "campaign": self.c.id,
                "comment": "hello world2",
                "files": [fake_file],
            },
        )
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        step_id = j["id"]
        s = BudgetStep.objects.get(id=step_id)

        # check the new state of campaign
        c = self.c
        c.refresh_from_db()
        self.assertEqual(c.budget_current_state_key, "budget_submitted")
        r = self.client.get(f"/api/polio/budget/{c.id}/")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["current_state"]["key"], "budget_submitted")
        # fixme serialization
        # self.assertEqual(j['budget_last_updated_at'], s.created_at.isoformat())

        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(s.files.count(), 1)
        r = self.client.get(f"/api/polio/budgetsteps/{s.id}/")
        j = self.assertJSONResponse(r, 200)
        f = j["files"][0]
        self.assertTrue(f["file"].startswith("http"))  # should be an url
        self.assertEqual(f["filename"], fake_file.name)

    def test_step_files(self):
        "With file and links"
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"
        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "campaign": self.c.id,
                "comment": "hello world2",
                "files": [fake_file],
            },
        )
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        step_id = j["id"]
        s = BudgetStep.objects.get(id=step_id)

        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(s.files.count(), 1)
        r = self.client.get(f"/api/polio/budgetsteps/{s.id}/")
        j = self.assertJSONResponse(r, 200)
        f = j["files"][0]
        self.assertTrue(f["file"].startswith("http"))  # should be an url
        self.assertEqual(f["filename"], fake_file.name)
        file_id = s.files.first().id
        self.assertEqual(f["id"], file_id)
        self.assertEqual(f["permanent_url"], f"/api/polio/budgetsteps/{s.id}/files/{file_id}/")
        r = self.client.get(f"/api/polio/budgetsteps/{s.id}/files/{file_id}/")
        self.assertIsInstance(r, HttpResponse)
        self.assertEqual(r.status_code, status.HTTP_302_FOUND, r)
        self.assertTrue(len(r.url) > 0)

    def test_transition_to_link(self):
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        fake_file = StringIO("hello world")
        fake_file.name = "mon_fichier.txt"
        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "campaign": self.c.id,
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
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        step_id = j["id"]
        s = BudgetStep.objects.get(id=step_id)

        # check the new state of campaign
        c = self.c
        c.refresh_from_db()
        self.assertEqual(c.budget_current_state_key, "budget_submitted")
        r = self.client.get(f"/api/polio/budget/{c.id}/")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["current_state"]["key"], "budget_submitted")
        # fixme serialization
        # self.assertEqual(j['budget_last_updated_at'], s.created_at.isoformat())

        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        self.assertEqual(s.files.count(), 1)
        r = self.client.get(f"/api/polio/budgetsteps/{s.id}/")
        j = self.assertJSONResponse(r, 200)
        f = j["files"][0]
        self.assertTrue(f["file"].startswith("http"))  # should be an url
        self.assertEqual(f["filename"], fake_file.name)

        links = j["links"]
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
        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

        r = self.client.post(
            "/api/polio/budget/transition_to/",
            data={
                "transition_key": "submit_budget",
                "campaign": self.c.id,
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
        j = self.assertJSONResponse(r, 201)
        self.assertEqual(j["result"], "success")
        step_id = j["id"]
        s = BudgetStep.objects.get(id=step_id)

        # check the new state of campaign
        c = self.c
        c.refresh_from_db()
        self.assertEqual(c.budget_current_state_key, "budget_submitted")
        r = self.client.get(f"/api/polio/budget/{c.id}/")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["current_state"]["key"], "budget_submitted")
        # fixme serialization
        # self.assertEqual(j['budget_last_updated_at'], s.created_at.isoformat())

        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 1, new_budget_step_count)

        r = self.client.get(f"/api/polio/budgetsteps/{s.id}/")
        j = self.assertJSONResponse(r, 200)

        links = j["links"]
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
        c = self.c
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
                "campaign": self.c.id,
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
                "campaign": self.c.id,
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
            campaign=self.c,
            transition_key="submit_budget",
            node_key_to="budget_submitted",
            created_by=self.user,
        )
        r = self.client.get("/api/polio/budget/export_csv/?fields=budget_last_updated_at")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/csv")
        d = bs.created_at.strftime("%Y-%m-%d")
        self.assertEqual(r.content.decode(), f"Last update\r\n{d}\r\n")


class BudgetProcessAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = Account.objects.create(name="test")
        cls.test_user = cls.create_user_with_profile(
            username="test_user", account=cls.account, permissions=["iaso_polio_budget"]
        )
        cls.test_user_no_permission = cls.create_user_with_profile(
            username="test_user_no_permission", account=cls.account
        )

        cls.campaign_1 = Campaign.objects.create(obr_name="test campaign", account=cls.test_user.iaso_profile.account)
        cls.rounds_0 = Round.objects.create(campaign=cls.campaign_1)
        cls.rounds_1 = Round.objects.create(campaign=cls.campaign_1)
        cls.rounds_2 = Round.objects.create(campaign=cls.campaign_1)

        cls.campaign_2 = Campaign.objects.create(obr_name="test campaign_2", account=cls.test_user.iaso_profile.account)

        cls.project1 = cls.account.project_set.create(name="project1")
        cls.team1 = Team.objects.create(project=cls.project1, name="budget_test_team", manager=cls.test_user)
        cls.team1.users.set([cls.test_user])

    def test_post_process(self):
        self.client.force_authenticate(self.test_user)

        data = {
            "created_by": self.test_user.pk,
            "created_by_team": self.team1.pk,
            "rounds": [self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk],
            "teams": self.team1.pk,
        }

        response = self.client.post("/api/polio/budgetprocesses/", data=data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["rounds"], [self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk])

    def test_get_process(self):
        self.client.force_authenticate(self.test_user)

        process = BudgetProcess.objects.create(
            created_by=self.test_user,
            created_by_team=self.team1,
        )
        process.rounds.set([self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk])
        process.teams.set([self.team1.pk])

        response = self.client.get("/api/polio/budgetprocesses/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["rounds"], [self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk])

    def test_user_need_permission(self):
        self.client.force_authenticate(self.test_user_no_permission)

        process = BudgetProcess.objects.create(
            created_by=self.test_user,
            created_by_team=self.team1,
        )
        process.rounds.set([self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk])
        process.teams.set([self.team1.pk])

        response = self.client.get("/api/polio/budgetprocesses/")

        self.assertEqual(response.status_code, 403)

    def test_cant_assign_same_round_to_multiple_processes(self):
        self.client.force_authenticate(self.test_user)

        process = BudgetProcess.objects.create(
            created_by=self.test_user,
            created_by_team=self.team1,
        )
        process.rounds.set([self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk])
        process.teams.set([self.team1.pk])

        data = {
            "created_by": self.test_user.pk,
            "created_by_team": self.team1.pk,
            "rounds": [self.rounds_0.pk, self.rounds_1.pk, self.rounds_2.pk],
            "teams": self.team1.pk,
        }

        response = self.client.post("/api/polio/budgetprocesses/", data=data)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["rounds"][0], "A BudgetProcess with the same Round(s) already exists.")
