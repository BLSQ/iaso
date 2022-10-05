from io import StringIO

from django.contrib.auth.models import User

from iaso.test import APITestCase
from plugins.polio.budget.models import BudgetStep
from plugins.polio.models import Campaign


class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

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
