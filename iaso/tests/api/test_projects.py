import typing
from django.test import tag

from iaso.test import APITestCase
from iaso import models as m


class ProjectsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health Initiative")
        wha = m.Account.objects.create(name="Worldwide Health Aid")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_forms"])
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=["iaso_forms"])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=wha)

        cls.project_1 = m.Project.objects.create(name="Project 1", app_id="org.ghi.p1", account=ghi)
        flag = m.FeatureFlag.objects.create(name="A feature", code="a_feature")
        cls.project_1.feature_flags.set([flag])
        m.Project.objects.create(name="Project 2", app_id="org.ghi.p2", account=ghi)

    @tag("iaso_only")
    def test_projects_list_without_auth(self):
        """GET /projects/ without auth should result in a 403"""

        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_projects_list_no_permission(self):
        """GET /projects/ with auth but without the proper permission"""

        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_projects_list_empty_for_user(self):
        """GET /projects/ with a user that has no access to any project"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 0)

    @tag("iaso_only")
    def test_projects_list_ok(self):
        """GET /projects/ happy path: we expect two results"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 2)

    @tag("iaso_only")
    def test_projects_list_paginated(self):
        """GET /projects/ paginated happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/?limit=1&page=1", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidProjectListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 2)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 2)

    @tag("iaso_only")
    def test_projects_retrieve_without_auth(self):
        """GET /projects/<project_id> without auth should result in a 403"""

        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_projects_retrieve_wrong_auth(self):
        """GET /projects/<project_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.john)
        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_projects_retrieve_not_found(self):
        """GET /projects/<project_id>: id does not exist"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/projects/292003030/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_projects_retrieve_ok(self):
        """GET /projects/<project_id> happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidProjectData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))
        self.assertValidFeatureFlagData(response_data["feature_flags"][0])

    @tag("iaso_only")
    def test_projects_create(self):
        """POST /projects/: not authorized for now"""

        self.client.force_authenticate(self.jane)
        response = self.client.post("/api/projects/", data={}, format="json")
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_projects_update(self):
        """PUT /projects/<project_id>: not authorized for now"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data={}, format="json")
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_projects_delete(self):
        """DELETE /projects/<project_id>: not authorized for now"""

        self.client.force_authenticate(self.jane)
        response = self.client.delete(f"/api/projects/{self.project_1.id}/", format="json")
        self.assertJSONResponse(response, 405)

    def assertValidProjectListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="projects", paginated=paginated
        )

        for project_data in list_data["projects"]:
            self.assertValidProjectData(project_data)

    def assertValidFeatureFlagData(self, feature_flag_data: typing.Mapping):
        self.assertHasField(feature_flag_data, "id", int)
        self.assertHasField(feature_flag_data, "name", str)
        self.assertHasField(feature_flag_data, "code", str)
        self.assertHasField(feature_flag_data, "description", str)
        self.assertHasField(feature_flag_data, "created_at", float)
        self.assertHasField(feature_flag_data, "updated_at", float)
