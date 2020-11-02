import typing
from django.test import tag

from iaso.test import APITestCase
from iaso import models as m


class AppsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Global Health Initiative")
        cls.project_1 = m.Project.objects.create(name="Project 1", account=account, app_id="org.ghi.p1")
        cls.project_2 = m.Project.objects.create(name="Project 2", account=account, app_id="org.ghi.p2")
        flag_1 = m.FeatureFlag.objects.create(
            code="send_location", name="Send GPS location", description="Send GPS location every time etc"
        )
        flag_2 = m.FeatureFlag.objects.create(code="another_feature", name="Anotther feature")
        cls.project_2.feature_flags.set([flag_1, flag_2])

    @tag("iaso_only")
    def test_apps_delete(self):
        """DELETE /apps/<app_id>/ without auth should result in a 405 response"""

        response = self.client.delete("/api/apps/org.ghi.p1/")
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_apps_list(self):
        """GET /apps/ is not implemented, should result in a 404 response"""

        response = self.client.get("/api/apps/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_apps_retrieve_current_not_found(self):
        """GET /apps/current/?app_id= with wrong app id"""

        response = self.client.get(f"/api/apps/current/?app_id=notanappid")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_apps_retrieve_current_no_app_id(self):
        """GET /apps/current/?app_id= without app id"""

        response = self.client.get(f"/api/apps/current/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_apps_retrieve_current_ok_1(self):
        """GET /apps/current/?app_id= happy path"""

        response = self.client.get(f"/api/apps/current/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual([], response_data["feature_flags"])

    @tag("iaso_only")
    def test_apps_retrieve_current_ok_2(self):
        """GET /apps/current/?app_id= happy path (with feature flags)"""

        response = self.client.get(f"/api/apps/current/?app_id={self.project_2.app_id}")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(2, len(response_data["feature_flags"]))

    @tag("iaso_only")
    def test_apps_retrieve_not_found(self):
        """GET /apps/<app_id>/ with wrong app id"""

        response = self.client.get("/api/apps/org.nope.nope/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_apps_retrieve_ok_1(self):
        """GET /apps/<app_id>/ happy path - standard detail endpoint, without ?app_id="""

        response = self.client.get(f"/api/apps/{self.project_1.app_id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual([], response_data["feature_flags"])

    @tag("iaso_only")
    def test_apps_retrieve_ok_2(self):
        """GET /apps/<app_id>/ happy path (with feature flags) - standard detail endpoint, without ?app_id="""

        response = self.client.get(f"/api/apps/{self.project_2.app_id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(2, len(response_data["feature_flags"]))

    def assertValidAppData(self, app_data: typing.Mapping):
        self.assertHasField(app_data, "id", str)
        self.assertHasField(app_data, "name", str)
        self.assertHasField(app_data, "feature_flags", list)
        self.assertHasField(app_data, "needs_authentication", bool)
        self.assertHasField(app_data, "created_at", float)
        self.assertHasField(app_data, "updated_at", float)
