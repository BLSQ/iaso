from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_LINKS_PERMISSION
from iaso.test import APITestCase


class AlgorithmsRunsAPITestCase(APITestCase):
    BASE_URL = "/api/algorithmsruns/"

    @classmethod
    def setUpTestData(cls):
        cls.data_source_destination = m.DataSource.objects.create(name="Destination source")
        cls.data_source_origin = m.DataSource.objects.create(name="Origin source")
        cls.version_destination = m.SourceVersion.objects.create(number=1, data_source=cls.data_source_destination)
        cls.version_origin = m.SourceVersion.objects.create(number=1, data_source=cls.data_source_origin)
        cls.version_destination_2 = m.SourceVersion.objects.create(number=2, data_source=cls.data_source_destination)

        cls.account = m.Account.objects.create(name="Account", default_version=cls.version_destination)
        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")
        cls.data_source_destination.projects.add(cls.project)
        cls.data_source_origin.projects.add(cls.project)

        cls.algorithm = m.MatchingAlgorithm.objects.create(
            name="iaso.matching.matching_on_external_id",
            description="ID Matching",
        )
        cls.algorithm.projects.add(cls.project)

        cls.user = cls.create_user_with_profile(
            username="user",
            account=cls.account,
            permissions=[CORE_LINKS_PERMISSION],
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_no_perms", account=cls.account)

        cls.algorithm_run = m.AlgorithmRun.objects.create(
            algorithm=cls.algorithm,
            version_1=cls.version_destination,
            version_2=cls.version_origin,
            launcher=cls.user,
        )

        cls.account_2, cls.data_source_2, cls.version_2, cls.project_2 = cls.create_account_datasource_version_project(
            "Other source", "Other account", "Other project"
        )
        cls.version_2_b = m.SourceVersion.objects.create(number=2, data_source=cls.data_source_2)
        cls.user_other_account = cls.create_user_with_profile(
            username="other_user",
            account=cls.account_2,
            permissions=[CORE_LINKS_PERMISSION],
        )
        cls.algorithm_other = m.MatchingAlgorithm.objects.create(name="other", description="other")
        cls.run_other_account = m.AlgorithmRun.objects.create(
            algorithm=cls.algorithm_other,
            version_1=cls.version_2,
            version_2=cls.version_2_b,
            launcher=cls.user_other_account,
        )

        cls.org_unit_type = m.OrgUnitType.objects.create(name="District", category="district")
        cls.org_unit_type.projects.add(cls.project)

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

        self.assertEqual(1, len(data))
        run = data[0]
        self.assertEqual(self.algorithm_run.id, run["id"])
        self.assertEqual(self.algorithm.id, run["algorithm_id"])
        self.assertEqual(self.algorithm.name, run["algorithm_name"])
        self.assertEqual(self.version_destination.id, run["destination"]["id"])
        self.assertEqual(self.version_origin.id, run["source"]["id"])

    def test_list_paginated(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.BASE_URL, {"limit": 10, "page": 1, "order": "created_at"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(1, data["count"])
        self.assertEqual(1, data["page"])
        self.assertEqual(1, data["pages"])
        self.assertEqual(10, data["limit"])
        self.assertFalse(data["has_next"])
        self.assertFalse(data["has_previous"])
        self.assertEqual(1, len(data["runs"]))
        self.assertEqual(self.algorithm_run.id, data["runs"][0]["id"])

    def test_list_filters(self):
        self.client.force_authenticate(self.user)
        other_run = m.AlgorithmRun.objects.create(
            algorithm=self.algorithm,
            version_1=self.version_destination_2,
            version_2=self.version_origin,
            launcher=self.user,
        )

        response = self.client.get(self.BASE_URL, {"algorithmId": self.algorithm.id})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual({self.algorithm_run.id, other_run.id}, {run["id"] for run in data})

        response = self.client.get(self.BASE_URL, {"origin": self.data_source_origin.id})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual({self.algorithm_run.id, other_run.id}, {run["id"] for run in data})

        response = self.client.get(self.BASE_URL, {"destination": self.data_source_destination.id})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual({self.algorithm_run.id, other_run.id}, {run["id"] for run in data})

        response = self.client.get(self.BASE_URL, {"originVersion": self.version_origin.number})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual({self.algorithm_run.id, other_run.id}, {run["id"] for run in data})

        response = self.client.get(self.BASE_URL, {"destinationVersion": self.version_destination_2.number})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([other_run.id], [run["id"] for run in data])

        response = self.client.get(self.BASE_URL, {"launcher": self.user.id})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual({self.algorithm_run.id, other_run.id}, {run["id"] for run in data})

    def test_list_excludes_other_account_runs(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.BASE_URL)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        run_ids = {run["id"] for run in data}
        self.assertIn(self.algorithm_run.id, run_ids)
        self.assertNotIn(self.run_other_account.id, run_ids)

    def test_retrieve_unauthenticated(self):
        response = self.client.get(f"{self.BASE_URL}{self.algorithm_run.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(f"{self.BASE_URL}{self.algorithm_run.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_retrieve(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.BASE_URL}{self.algorithm_run.id}/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(self.algorithm_run.id, data["id"])
        self.assertEqual(self.algorithm.id, data["algorithm"]["id"])
        self.assertEqual(self.version_destination.id, data["destination"]["id"])
        self.assertEqual(self.version_origin.id, data["source"]["id"])
        self.assertEqual(self.user.id, data["launcher"]["user_id"])
        self.assertEqual(0, data["links_count"])

    def test_create_unauthenticated(self):
        response = self.client.post(
            self.BASE_URL,
            {
                "algo": self.algorithm.id,
                "destination": self.version_destination.id,
                "source": self.version_origin.id,
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.post(
            self.BASE_URL,
            {
                "algo": self.algorithm.id,
                "destination": self.version_destination.id,
                "source": self.version_origin.id,
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_create(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            {
                "algo": self.algorithm.id,
                "destination": self.version_destination.id,
                "source": self.version_origin.id,
            },
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(self.algorithm.id, data["algorithm"]["id"])
        self.assertEqual(self.version_destination.id, data["destination"]["id"])
        self.assertEqual(self.version_origin.id, data["source"]["id"])
        self.assertEqual(self.user.id, data["launcher"]["user_id"])
        self.assertTrue(m.AlgorithmRun.objects.filter(id=data["id"]).exists())

    def test_create_permission_denied_for_other_account_versions(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            {
                "algo": self.algorithm.id,
                "destination": self.version_2.id,
                "source": self.version_2_b.id,
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_delete_unauthenticated(self):
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm_run.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm_run.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_delete(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"{self.BASE_URL}{self.algorithm_run.id}/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertTrue(data)
        self.assertFalse(m.AlgorithmRun.objects.filter(id=self.algorithm_run.id).exists())

    def test_update_unauthenticated(self):
        response = self.client.put(
            f"{self.BASE_URL}0/",
            {
                "algoId": self.algorithm.id,
                "sourceOriginId": self.data_source_origin.id,
                "versionOrigin": self.version_origin.number,
                "sourceDestinationId": self.data_source_destination.id,
                "versionDestination": self.version_destination.number,
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_update_without_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.put(
            f"{self.BASE_URL}0/",
            {
                "algoId": self.algorithm.id,
                "sourceOriginId": self.data_source_origin.id,
                "versionOrigin": self.version_origin.number,
                "sourceDestinationId": self.data_source_destination.id,
                "versionDestination": self.version_destination.number,
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_update_launches_matching_algorithm(self):
        m.OrgUnit.objects.create(
            version=self.version_destination,
            name="Unit destination",
            org_unit_type=self.org_unit_type,
            source_ref="shared-ref",
        )
        m.OrgUnit.objects.create(
            version=self.version_origin,
            name="Unit origin",
            org_unit_type=self.org_unit_type,
            source_ref="shared-ref",
        )

        self.client.force_authenticate(self.user)
        response = self.client.put(
            f"{self.BASE_URL}0/",
            {
                "algoId": self.algorithm.id,
                "sourceOriginId": self.data_source_origin.id,
                "versionOrigin": self.version_origin.number,
                "sourceDestinationId": self.data_source_destination.id,
                "versionDestination": self.version_destination.number,
            },
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertTrue(data)

        launched_run = m.AlgorithmRun.objects.latest("id")
        self.assertTrue(launched_run.finished)
        self.assertEqual(self.user, launched_run.launcher)
        self.assertEqual(1, m.Link.objects.filter(algorithm_run=launched_run).count())
