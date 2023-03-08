from iaso import models as m
from iaso.api.query_params import APP_ID, APP_VERSION
from iaso.test import APITestCase


BASE_URL = "/api/mobile/checkversion/"


class CheckVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Global Health Initiative")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_forms"])
        cls.project_1 = m.Project.objects.create(
            name="Project 1", account=account, app_id="org.ghi.p1", min_version=None
        )
        cls.project_2 = m.Project.objects.create(
            name="Project 2", account=account, app_id="org.ghi.p2", min_version=1234
        )

    def test_check_version_delete(self):
        """DELETE /api/mobile/checkversion should result in a 405 response"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"{BASE_URL}")
        self.assertJSONResponse(response, 405)

    def test_check_version_put(self):
        """PUT /api/mobile/checkversion should result in a 405 response"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"{BASE_URL}")
        self.assertJSONResponse(response, 405)

    def test_check_version_post(self):
        """POST /api/mobile/checkversion should result in a 405 response"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"{BASE_URL}")
        self.assertJSONResponse(response, 405)

    def test_get_check_version_without_app_id_and_app_version(self):
        """GET /api/mobile/checkversion without parameters should result in a 400 response"""

        response = self.client.get(f"{BASE_URL}")
        self.assertJSONResponse(response, 400)

    def test_get_check_version_without_app_id(self):
        """GET /api/mobile/checkversion without app_id should result in a 400 response"""

        response = self.client.get(f"{BASE_URL}?{APP_VERSION}=1234")
        self.assertJSONResponse(response, 400)

    def test_get_check_version_without_app_version(self):
        """GET /api/mobile/checkversion without app_version should result in a 400 response"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_2.app_id}")
        self.assertJSONResponse(response, 400)

    def test_get_check_version_with_wrong_app_version(self):
        """GET /api/mobile/checkversion with an app_version which is not an int should result in a 400 response"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_2.app_id}&{APP_VERSION}=123AF")
        self.assertJSONResponse(response, 400)

    def test_get_check_version_with_nonexisting_project(self):
        """GET /api/mobile/checkversion with an app_id which doesn't exist should result in a 404"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}=wrong.project.id&{APP_VERSION}=1000")
        self.assertJSONResponse(response, 404)

    def test_get_check_version_for_project_with_no_min_version(self):
        """GET /api/mobile/checkversion for a project with no min_version should always return ok"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_1.app_id}&{APP_VERSION}=-1000")
        self.assertJSONResponse(response, 204)

    def test_get_check_version_for_project_with_min_version_higher_than_provided(self):
        """GET /api/mobile/checkversion for a project with a min_version higher than the one provided should result
        in a 426 response"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_2.app_id}&{APP_VERSION}=1000")
        self.assertJSONResponse(response, 426)

    def test_get_check_version_for_project_with_min_version_lower_than_provided(self):
        """GET /api/mobile/checkversion for a project with a min_version lower than the one provided should result
        in a 204 response"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_2.app_id}&{APP_VERSION}=5000")
        self.assertJSONResponse(response, 204)

    def test_get_check_version_for_project_with_min_version_equal_to_than_provided(self):
        """GET /api/mobile/checkversion for a project with a min_version equal to the one provided should result
        in a 204 response"""

        response = self.client.get(f"{BASE_URL}?{APP_ID}={self.project_2.app_id}&{APP_VERSION}=1234")
        self.assertJSONResponse(response, 204)
