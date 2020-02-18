from django.test import tag
from django.contrib.auth import get_user_model
from iaso import models as m
from rest_framework.test import APITestCase, APIClient


class ProjectsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        user_1 = User.objects.create(first_name="Jane", last_name="Doe", username="johndoe",
                                     email="johndoe@bluesquarehub.com")
        user_2 = User.objects.create(first_name="John", last_name="Doe", username="janedoe",
                                     email="janedoe@bluesquarehub.com")
        account_1 = m.Account.objects.create(name="Global Health initial")
        account_2 = m.Account.objects.create(name="Worldwide Health Aid")
        m.Profile.objects.create(user=user_1, account=account_1)
        m.Profile.objects.create(user=user_2, account=account_2)
        project_1 = m.Project.objects.create(name="Project 1", app_id="org.ghi.p1", account=account_1)
        m.Project.objects.create(name="Project 2", app_id="org.ghi.p2", account=account_1)

        cls.user_1 = user_1
        cls.user_2 = user_2
        cls.project_1 = project_1

    def setUp(self) -> None:
        self.client = APIClient()

    @tag("iaso_only")
    def test_projects_list_without_auth(self):
        """GET /projects/ without auth should result in a 403"""

        response = self.client.get('/api/projects/')
        self.assertEqual(403, response.status_code)

    @tag("iaso_only")
    def test_projects_list_empy_for_user(self):
        """GET /projects/ with a user that has no access to any project"""

        self.client.force_authenticate(self.user_2)
        response = self.client.get('/api/projects/')
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        response_data = response.json()
        self.assertEqual(0, len(response_data["projects"]))

    @tag("iaso_only")
    def test_projects_list_ok(self):
        """GET /projects/ with proper authentication: we expect two results"""

        self.client.force_authenticate(self.user_1)
        response = self.client.get('/api/projects/', headers={'Content-Type': 'application/json'})
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        response_data = response.json()
        self.assertEqual(2, len(response_data["projects"]))

        project_1_data = next(pd for pd in response_data["projects"] if pd["id"] == self.project_1.id)
        self.assertEqual(project_1_data["name"], self.project_1.name)
        self.assertEqual(project_1_data["app_id"], self.project_1.app_id)
        self.assertIn("created_at", project_1_data)
        self.assertIn("updated_at", project_1_data)
