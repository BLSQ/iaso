import typing
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
        self.assertEqual('application/json', response['Content-Type'])

    @tag("iaso_only")
    def test_projects_list_empty_for_user(self):
        """GET /projects/ with a user that has no access to any project"""

        self.client.force_authenticate(self.user_2)
        response = self.client.get('/api/projects/')
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        self.assertValidProjectListData(response.data, 0)

    @tag("iaso_only")
    def test_projects_list_ok(self):
        """GET /projects/ happy path: we expect two results"""

        self.client.force_authenticate(self.user_1)
        response = self.client.get('/api/projects/', headers={'Content-Type': 'application/json'})
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        self.assertValidProjectListData(response.data, 2)

    @tag("iaso_only")
    def test_projects_list_paginated(self):
        """GET /projects/ paginated happy path"""

        self.client.force_authenticate(self.user_1)
        response = self.client.get('/api/projects/?limit=1&page=1', headers={'Content-Type': 'application/json'})
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        self.assertValidProjectListData(response.data, 1, True)

    @tag("iaso_only")
    def test_projects_retrieve_without_auth(self):
        """GET /projects/<project_id> without auth should result in a 403"""

        response = self.client.get(f'/api/projects/{self.project_1.id}/')
        self.assertEqual(403, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

    @tag("iaso_only")
    def test_projects_retrieve_wrong_auth(self):
        """GET /projects/<project_id> with auth of unrelated user should result in a 403"""

        self.client.force_authenticate(self.user_2)
        response = self.client.get(f'/api/projects/{self.project_1.id}/')
        self.assertEqual(403, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

    @tag("iaso_only")
    def test_projects_retrieve_not_found(self):
        """GET /projects/<project_id>: id does not exist"""

        self.client.force_authenticate(self.user_1)
        response = self.client.get(f'/api/projects/292003030/')
        self.assertEqual(404, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

    @tag("iaso_only")
    def test_projects_retrieve_ok(self):
        """GET /projects/<project_id> happy path"""

        self.client.force_authenticate(self.user_1)
        response = self.client.get(f'/api/projects/{self.project_1.id}/')
        self.assertEqual(200, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

        self.assertValidProjectData(response.data)

    def assertValidProjectListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertIn("projects", list_data)
        self.assertEqual(expected_length, len(list_data["projects"]))

        if paginated:
            self.assertIn("has_next", list_data)
            self.assertIsInstance(list_data["has_next"], bool)
            self.assertIn("has_previous", list_data)
            self.assertIsInstance(list_data["has_previous"], bool)
            self.assertIn("page", list_data)
            self.assertIsInstance(list_data["page"], int)
            self.assertIn("pages", list_data)
            self.assertIsInstance(list_data["pages"], int)
            self.assertIn("limit", list_data)
            self.assertIsInstance(list_data["limit"], int)

        for project_data in list_data["projects"]:
            self.assertValidProjectData(project_data)

    def assertValidProjectData(self, project_data: typing.Mapping):
        self.assertIn("id", project_data)
        self.assertIsInstance(project_data["id"], int)
        self.assertIn("name", project_data)
        self.assertIsInstance(project_data["name"], str)
        self.assertIn("created_at", project_data)
        self.assertIsInstance(project_data["created_at"], float)
        self.assertIn("updated_at", project_data)
        self.assertIsInstance(project_data["updated_at"], float)
