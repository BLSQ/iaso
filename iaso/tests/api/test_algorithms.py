from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_LINKS_PERMISSION
from iaso.test import APITestCase


class AlgorithmsAPITestCase(APITestCase):
    BASE_URL = "/api/algorithms/"

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.version)
        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")
        cls.data_source.projects.add(cls.project)

        cls.algorithm = m.MatchingAlgorithm.objects.create(
            name="iaso.matching.matching_on_external_id",
            description="ID Matching",
        )
        cls.algorithm.projects.add(cls.project)

        cls.global_algorithm = m.MatchingAlgorithm.objects.create(
            name="iaso.matching.global",
            description="Global algorithm",
        )

        cls.user = cls.create_user_with_profile(
            username="user",
            account=cls.account,
            permissions=[CORE_LINKS_PERMISSION],
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_no_perms", account=cls.account)

        cls.account_2, cls.data_source_2, cls.version_2, cls.project_2 = cls.create_account_datasource_version_project(
            "Other source", "Other account", "Other project"
        )
        cls.user_other_account = cls.create_user_with_profile(
            username="other_user",
            account=cls.account_2,
            permissions=[CORE_LINKS_PERMISSION],
        )
        cls.algorithm_other_account = m.MatchingAlgorithm.objects.create(
            name="other.account.algo",
            description="Other account algorithm",
        )
        cls.algorithm_other_account.projects.add(cls.project_2)

    def test_list_unauthenticated(self):
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.BASE_URL)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        algorithm_ids = {algorithm["id"] for algorithm in data}
        self.assertIn(self.algorithm.id, algorithm_ids)
        self.assertIn(self.global_algorithm.id, algorithm_ids)
        self.assertNotIn(self.algorithm_other_account.id, algorithm_ids)

        algorithm = next(item for item in data if item["id"] == self.algorithm.id)
        self.assertEqual(self.algorithm.name, algorithm["name"])
        self.assertEqual(self.algorithm.description, algorithm["description"])
        self.assertEqual([self.project.id], algorithm["projects"])

    def test_retrieve_unauthenticated(self):
        response = self.client.get(f"{self.BASE_URL}{self.algorithm.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(f"{self.BASE_URL}{self.algorithm.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_retrieve(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.BASE_URL}{self.algorithm.id}/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(self.algorithm.id, data["id"])
        self.assertEqual(self.algorithm.name, data["name"])
        self.assertEqual(self.algorithm.description, data["description"])
        self.assertEqual([self.project.id], data["projects"])

    def test_retrieve_other_account_algorithm(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.BASE_URL}{self.algorithm_other_account.id}/")
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

    def test_create_unauthenticated(self):
        response = self.client.post(
            self.BASE_URL,
            {
                "name": "iaso.matching.new",
                "description": "New algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.post(
            self.BASE_URL,
            {
                "name": "iaso.matching.new",
                "description": "New algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_create(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            {
                "name": "iaso.matching.new",
                "description": "New algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)

        self.assertEqual("iaso.matching.new", data["name"])
        self.assertEqual("New algorithm", data["description"])
        self.assertEqual([self.project.id], data["projects"])
        self.assertTrue(m.MatchingAlgorithm.objects.filter(id=data["id"]).exists())

    def test_update_unauthenticated(self):
        response = self.client.put(
            f"{self.BASE_URL}{self.algorithm.id}/",
            {
                "name": "iaso.matching.updated",
                "description": "Updated algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_update_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.put(
            f"{self.BASE_URL}{self.algorithm.id}/",
            {
                "name": "iaso.matching.updated",
                "description": "Updated algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_update(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(
            f"{self.BASE_URL}{self.algorithm.id}/",
            {
                "name": "iaso.matching.updated",
                "description": "Updated algorithm",
                "projects": [self.project.id],
            },
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual("iaso.matching.updated", data["name"])
        self.assertEqual("Updated algorithm", data["description"])
        self.algorithm.refresh_from_db()
        self.assertEqual("iaso.matching.updated", self.algorithm.name)
        self.assertEqual("Updated algorithm", self.algorithm.description)

    def test_delete_unauthenticated(self):
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_delete(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm.id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)
        self.assertFalse(m.MatchingAlgorithm.objects.filter(id=self.algorithm.id).exists())
