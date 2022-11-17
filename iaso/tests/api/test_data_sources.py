from iaso.test import APITestCase
from iaso import models as m


class DataSourcesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = ghi = m.Account.objects.create(name="Global Health Initiative")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_sources"])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=ghi)

        cls.ghi_project = m.Project.objects.create(name="ghi_project", account=ghi)

    def test_datasource_list_without_auth(self):
        """GET /datasources/ without auth should result in a 403"""

        response = self.client.get("/api/datasources/")
        self.assertJSONResponse(response, 403)

    # def test_datasource_list_with_auth_no_permissions(self):
    #     """GET /projects/ with auth should result in a 405 as method is not allowed"""
    #     self.client.force_authenticate(self.jim)
    #
    #     response = self.client.get("/api/datasources/")
    #     self.assertJSONResponse(response, 405)

    def test_datasource_list_with_auth_ok(self):
        """GET /datasource/ with auth should result in a 200"""
        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/datasources/")
        self.assertJSONResponse(response, 200)

    def test_datasource_list_with_all_params(self):
        """GET /datasource/ with all params should work OK"""
        self.client.force_authenticate(self.jane)

        response = self.client.post(
            "/api/datasources/",
            format="json",
            data={
                "name": "test_name",
                "read_only": True,
                "description": "test_description",
                "credentials": {
                    "dhis_name": "test_name",
                    "dhis_login": "test_login",
                    "dhis_url": "test_url",
                    "dhis_password": "test_password",
                },
                "project_ids": [self.ghi_project.pk],
            },
        )

        self.assertJSONResponse(response, 201)

    def test_datasource_list_without_credentials(self):
        """GET /datasource/ without credentials should NOT fails"""
        self.client.force_authenticate(self.jane)

        response = self.client.post(
            "/api/datasources/",
            format="json",
            data={
                "name": "test_name",
                "read_only": True,
                "description": "test_description",
                "project_ids": [self.ghi_project.pk],
            },
        )
        self.assertJSONResponse(response, 201)

    def test_datasource_list_without_project_ids(self):
        """GET /datasource/ without project_ids should NOT fail"""
        self.client.force_authenticate(self.jane)

        response = self.client.post(
            "/api/datasources/",
            format="json",
            data={
                "name": "test_name",
                "read_only": True,
                "description": "test_description",
                "credentials": {
                    "dhis_name": "test_name",
                    "dhis_login": "test_login",
                    "dhis_url": "test_url",
                    "dhis_password": "test_password",
                },
            },
        )
        self.assertJSONResponse(response, 201)
