from io import StringIO
from typing import List, Dict

from django.contrib.auth.models import User

from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetStep
from plugins.polio.models import Campaign


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
        cls.c = Campaign.objects.create(obr_name="test campaign")

    def test_simple_get_list(self):
        self.client.force_login(self.user)

        r = self.client.get("/api/polio/budget/")
        j = self.assertJSONResponse(r, 200)
        campaigns = j["results"]
        for c in campaigns:
            self.assertEqual(c["obr_name"], "test campaign")

    def test_transition_to(self):
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
                "links[0]url": "http://helloworld",
                "links[0]alias": "hello world",
                "links[1]alias": "mon petit lien",
                "links[1]url": "https://lien.com",
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

    def test_next_steps_after_transition(self):
        self.client.force_login(self.user)
        prev_budget_step_count = BudgetStep.objects.count()
        c = self.c
        r = self.client.get(f"/api/polio/budget/{c.id}/")
        j = self.assertJSONResponse(r, 200)

        # check initial status and possible transition on campaign
        self.assertEqual(j["obr_name"], "test campaign")
        self.assertEqual(j["current_state"]["key"], None)
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
        s = BudgetStep.objects.get(id=step_id)

        # Check new status on campaign
        r = self.client.get(f"/api/polio/budget/{c.id}/")
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
        s = BudgetStep.objects.get(id=step_id)
        # check that we have only created one step
        new_budget_step_count = BudgetStep.objects.count()
        self.assertEqual(prev_budget_step_count + 2, new_budget_step_count)

        # Check new status on campaign
        r = self.client.get(f"/api/polio/budget/{c.id}/")
        j = self.assertJSONResponse(r, 200)

        self.assertEqual(j["obr_name"], "test campaign")
        self.assertEqual(j["current_state"]["key"], "accepted")
        self.assertTrue(isinstance(j["budget_last_updated_at"], str) and len(j["budget_last_updated_at"]) > 0)
        self.assertTrue(isinstance(j["next_transitions"], list))

        # Final transition there is none after
        self.assertEqual(len(j["next_transitions"]), 0)
