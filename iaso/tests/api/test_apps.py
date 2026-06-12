import typing

from iaso import models as m
from iaso.models import FeatureFlag
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_PROJECTS_PERMISSION
from iaso.test import APITestCase


class AppsAPITestCase(APITestCase):
    user_with_projects_permission: m.User
    user_without_projects_permission: m.User
    project_1: m.Project
    project_2: m.Project
    flag_1: m.FeatureFlag
    flag_2: m.FeatureFlag
    flag_3: m.FeatureFlag
    flag_4: m.FeatureFlag

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Global Health Initiative")
        # Can perform write operations on apps.
        cls.user_with_projects_permission = cls.create_user_with_profile(
            username="user_with_projects_permission", account=account, permissions=[CORE_PROJECTS_PERMISSION]
        )
        # Authenticated but lacks `CORE_PROJECTS_PERMISSION`, so cannot write.
        cls.user_without_projects_permission = cls.create_user_with_profile(
            username="user_without_projects_permission", account=account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.project_1 = m.Project.objects.create(
            name="Project 1",
            account=account,
            app_id="org.ghi.p1",
            description="Project 1 description",
        )
        cls.project_2 = m.Project.objects.create(
            name="Project 2", account=account, app_id="org.ghi.p2", min_version=1234
        )
        cls.flag_1 = m.FeatureFlag.objects.create(
            code="send_location", name="Send GPS location", description="Send GPS location every time etc"
        )
        cls.flag_2 = m.FeatureFlag.objects.create(code="another_feature", name="Another feature")
        cls.flag_3 = m.FeatureFlag.objects.get(code=FeatureFlag.REQUIRE_AUTHENTICATION)
        cls.flag_4 = m.FeatureFlag.objects.create(
            code="FEATURE_FLAG_THAT_REQUIRES_AUTHENTICATION",
            name="Has a dependency on 'REQUIRE_AUTHENTICATION'",
            requires_authentication=True,
            description="Cannot be added to a project without the feature flag 'REQUIRE_AUTHENTICATION'",
        )
        cls.flag_5 = m.FeatureFlag.objects.create(
            code="with_configuration",
            name="With configuration",
            requires_authentication=True,
            description="A feature flag with a configuration",
            configuration_schema={
                "distance": {
                    "type": "int",
                    "description": "Something",
                    "default": 1,
                }
            },
        )
        cls.flag_6 = m.FeatureFlag.objects.create(
            code="with_all_configuration_types",
            name="With all configuration_types",
            description="A feature flag with all configuration types",
            configuration_schema={
                "int": {
                    "type": "int",
                    "description": "An int",
                    "default": 1,
                },
                "long": {
                    "type": "long",
                    "description": "A long",
                    "default": 1,
                },
                "number": {
                    "type": "number",
                    "description": "A number",
                    "default": 1,
                },
                "float": {
                    "type": "float",
                    "description": "A float",
                    "default": 1,
                },
                "double": {
                    "type": "double",
                    "description": "A double",
                    "default": 1,
                },
                "decimal": {
                    "type": "decimal",
                    "description": "A decimal",
                    "default": 1,
                },
                "url": {
                    "type": "url",
                    "description": "A url",
                    "default": 1,
                },
                "text": {
                    "type": "text",
                    "description": "A text",
                    "default": 1,
                },
                "str": {
                    "type": "str",
                    "description": "A str",
                    "default": 1,
                },
                "string": {
                    "type": "string",
                    "description": "A string",
                    "default": 1,
                },
            },
        )
        cls.project_2.feature_flags.set([cls.flag_1, cls.flag_2])

    def test_apps_delete(self):
        """DELETE /apps/<app_id>/ without auth should result in a 401 response"""

        response = self.client.delete("/api/apps/org.ghi.p1/")
        self.assertJSONResponse(response, 401)

    def test_apps_list(self):
        """GET /apps/ is not implemented, should result in a 404 response"""

        response = self.client.get("/api/apps/")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_current_not_found(self):
        """GET /apps/current/?app_id= with wrong app id"""

        response = self.client.get("/api/apps/current/?app_id=notanappid")
        self.assertJSONResponse(response, 404)

    def test_apps_retrieve_current_no_app_id(self):
        """GET /apps/current/?app_id= without app id"""

        response = self.client.get("/api/apps/current/")
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

    def test_apps_retrieve_ok_queries_capped(self):
        """Ensure app detail does not trigger N+1 on feature flags/forms."""

        with self.assertNumQueries(3):
            response = self.client.get(f"/api/apps/{self.project_2.app_id}/")
            self.assertJSONResponse(response, 200)
            response_data = response.json()
            self.assertValidAppData(response_data)
            self.assertEqual(2, len(response_data["feature_flags"]))

    def test_apps_create_not_allowed(self):
        """POST /apps/ is no longer supported. Project creation now goes through /api/projects/."""
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.user_with_projects_permission)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 405)

    def test_apps_create_without_auth(self):
        """POST /apps/ without auth is rejected before the method check."""
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [],
            "needs_authentication": False,
        }
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 401)

    def test_apps_update_not_allowed(self):
        """PUT /apps/<app_id>/ is no longer supported. Project updates now go through /api/projects/."""
        candidate_app = {"name": "This is an existing app", "feature_flags": []}
        self.client.force_authenticate(self.user_with_projects_permission)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 405)

    def assertValidAppData(self, app_data: typing.Mapping) -> None:
        self.assertHasField(app_data, "id", str)
        self.assertHasField(app_data, "name", str)
        self.assertHasField(app_data, "description", str)
        self.assertHasField(app_data, "feature_flags", list)
        self.assertHasField(app_data, "min_version", int, optional=True)
        self.assertHasField(app_data, "needs_authentication", bool)
        self.assertHasField(app_data, "created_at", float)
        self.assertHasField(app_data, "updated_at", float)
