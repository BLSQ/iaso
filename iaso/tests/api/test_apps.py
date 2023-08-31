import typing

from iaso import models as m
from iaso.test import APITestCase


class AppsAPITestCase(APITestCase):
    yoda: m.User
    project_1: m.Project
    project_2: m.Project
    flag_1: m.FeatureFlag
    flag_2: m.FeatureFlag
    flag_3: m.FeatureFlag
    flag_4: m.FeatureFlag

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Global Health Initiative")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_forms"])
        cls.project_1 = m.Project.objects.create(name="Project 1", account=account, app_id="org.ghi.p1")
        cls.project_2 = m.Project.objects.create(
            name="Project 2", account=account, app_id="org.ghi.p2", min_version=1234
        )
        cls.flag_1 = m.FeatureFlag.objects.create(
            code="send_location", name="Send GPS location", description="Send GPS location every time etc"
        )
        cls.flag_2 = m.FeatureFlag.objects.create(code="another_feature", name="Another feature")
        cls.flag_3 = m.FeatureFlag.objects.create(
            code="REQUIRE_AUTHENTICATION",
            name="Exige l'authentification pour télécharger",
            description="Exige l'authentification pour télécharger",
        )
        cls.flag_4 = m.FeatureFlag.objects.create(
            code="FEATURE_FLAG_THAT_REQUIRES_AUTHENTICATION",
            name="Has a dependency on 'REQUIRE_AUTHENTICATION'",
            requires_authentication=True,
            description="Cannot be added to a project without the feature flag 'REQUIRE_AUTHENTICATION'",
        )
        cls.project_2.feature_flags.set([cls.flag_1, cls.flag_2])

    def test_apps_delete(self):
        """DELETE /apps/<app_id>/ without auth should result in a 405 response"""

        response = self.client.delete("/api/apps/org.ghi.p1/")
        self.assertJSONResponse(response, 403)

    def test_apps_list(self):
        """GET /apps/ is not implemented, should result in a 404 response"""

        response = self.client.get("/api/apps/")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_current_not_found(self):
        """GET /apps/current/?app_id= with wrong app id"""

        response = self.client.get(f"/api/apps/current/?app_id=notanappid")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_current_no_app_id(self):
        """GET /apps/current/?app_id= without app id"""

        response = self.client.get(f"/api/apps/current/")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_current_ok_1(self):
        """GET /apps/current/?app_id= happy path"""

        response = self.client.get(f"/api/apps/current/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual([], response_data["feature_flags"])

    def test_apps_retrieve_current_ok_2(self):
        """GET /apps/current/?app_id= happy path (with feature flags)"""

        response = self.client.get(f"/api/apps/current/?app_id={self.project_2.app_id}")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(2, len(response_data["feature_flags"]))

    def test_apps_retrieve_not_found(self):
        """GET /apps/<app_id>/ with wrong app id"""

        response = self.client.get("/api/apps/org.nope.nope/")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_ok_1(self):
        """GET /apps/<app_id>/ happy path - standard detail endpoint, without ?app_id="""

        response = self.client.get(f"/api/apps/{self.project_1.app_id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual([], response_data["feature_flags"])

    def test_apps_retrieve_ok_2(self):
        """GET /apps/<app_id>/ happy path (with feature flags) - standard detail endpoint, without ?app_id="""

        response = self.client.get(f"/api/apps/{self.project_2.app_id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(2, len(response_data["feature_flags"]))

    def test_app_create_ok_with_auth(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))

    def test_app_create_ok_with_auth_2(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))

        candidated_app_2 = {"name": "This is a new app 2", "app_id": "com.this.is.new.app", "feature_flags": []}
        response = self.client.post(
            f"/api/apps/", candidated_app_2, format="json"
        )  # "can't create two apps with the same id"
        self.assertJSONResponse(response, 400)

    def test_app_create_ok_without_feature_flags_with_auth(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 201)

    def test_app_create_auto_commit_require_auth_ok_with_auth(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": True,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertTrue("REQUIRE_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"]))

    def test_app_create_auto_commit_true_when_require_auth_flag_auth_ok(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_3.id, "name": self.flag_3.name, "code": self.flag_3.code}],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue("REQUIRE_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"]))
        self.assertEqual(True, response_data["needs_authentication"])

    def test_app_create_without_auth(self):
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }

        response = self.client.post(f"/api/apps/", candidated_app, format="json")
        self.assertJSONResponse(response, 403)

    def test_app_update_and_commit_require_auth_ok_with_auth(self):
        candidated_app = {
            "name": "This is a newly updated app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": True,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidated_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertGreaterEqual(2, len(response_data["feature_flags"]))
        self.assertTrue("REQUIRE_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"]))

    def test_app_update_OK_without_feature_flags_with_auth(self):
        candidated_app = {"app_id": "self.project_1ddes.app_id", "name": "This is an existing app", "feature_flags": []}
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidated_app, format="json")
        self.assertJSONResponse(response, 200)

    def test_app_update_auto_commit_require_auth_true_when_flag_auth_ok(self) -> None:
        candidated_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_3.id, "name": self.flag_3.name, "code": self.flag_3.code}],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidated_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue("REQUIRE_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"]))
        self.assertEqual(True, response_data["needs_authentication"])

    def test_app_update_with_flag_that_requires_authentication_has_it(self) -> None:
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [
                {"id": self.flag_4.id, "name": self.flag_4.name, "code": self.flag_4.code},
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [
                {"id": self.flag_3.id, "name": self.flag_3.name, "code": self.flag_3.code},
                {"id": self.flag_4.id, "name": self.flag_4.name, "code": self.flag_4.code},
            ],
        }
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue("REQUIRE_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"]))
        self.assertTrue(
            "FEATURE_FLAG_THAT_REQUIRES_AUTHENTICATION" in list(ff["code"] for ff in response_data["feature_flags"])
        )

    def assertValidAppData(self, app_data: typing.Mapping) -> None:
        self.assertHasField(app_data, "id", str)
        self.assertHasField(app_data, "name", str)
        self.assertHasField(app_data, "feature_flags", list)
        self.assertHasField(app_data, "min_version", int, optional=True)
        self.assertHasField(app_data, "needs_authentication", bool)
        self.assertHasField(app_data, "created_at", float)
        self.assertHasField(app_data, "updated_at", float)
