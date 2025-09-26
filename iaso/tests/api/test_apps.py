import typing

from iaso import models as m
from iaso.models import FeatureFlag
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
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
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=[CORE_FORMS_PERMISSION])
        cls.project_1 = m.Project.objects.create(name="Project 1", account=account, app_id="org.ghi.p1")
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

    def test_app_create_ok_with_auth(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))

    def test_app_cant_create_app_with_existing_id(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))

        candidate_app_2 = {"name": "This is a new app 2", "app_id": "com.this.is.new.app", "feature_flags": []}
        response = self.client.post(
            "/api/apps/", candidate_app_2, format="json"
        )  # "can't create two apps with the same id"
        self.assertJSONResponse(response, 400)

    def test_app_create_ok_without_feature_flags_with_auth(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [],
            "needs_authentication": False,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 201)

    def test_app_create_auto_commit_require_auth_ok_with_auth(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": True,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertTrue(FeatureFlag.REQUIRE_AUTHENTICATION in list(ff["code"] for ff in response_data["feature_flags"]))

    def test_app_create_auto_commit_true_when_require_auth_flag_auth_ok(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_3.id, "name": self.flag_3.name, "code": self.flag_3.code}],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue(FeatureFlag.REQUIRE_AUTHENTICATION in list(ff["code"] for ff in response_data["feature_flags"]))
        self.assertEqual(True, response_data["needs_authentication"])

    def test_app_create_without_auth(self):
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": False,
        }

        response = self.client.post("/api/apps/", candidate_app, format="json")
        self.assertJSONResponse(response, 401)

    def test_app_update_and_commit_require_auth_ok_with_auth(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [{"id": self.flag_1.id, "name": self.flag_1.name, "code": self.flag_1.code}],
            "needs_authentication": True,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertGreaterEqual(2, len(response_data["feature_flags"]))
        self.assertTrue(FeatureFlag.REQUIRE_AUTHENTICATION in list(ff["code"] for ff in response_data["feature_flags"]))

    def test_app_update_OK_without_feature_flags_with_auth(self):
        candidate_app = {"app_id": "self.project_1ddes.app_id", "name": "This is an existing app", "feature_flags": []}
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)

    def test_app_update_auto_commit_require_auth_true_when_flag_auth_ok(self) -> None:
        candidate_app = {
            "name": "This is a new app",
            "app_id": "com.this.is.new.app",
            "feature_flags": [{"id": self.flag_3.id, "name": self.flag_3.name, "code": self.flag_3.code}],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue(FeatureFlag.REQUIRE_AUTHENTICATION in list(ff["code"] for ff in response_data["feature_flags"]))
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

    def test_app_update_without_configuration(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_5.id,
                    "name": self.flag_5.name,
                    "code": self.flag_5.code,
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

    def test_app_update_with_configuration(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_5.id,
                    "name": self.flag_5.name,
                    "code": self.flag_5.code,
                    "configuration": {"distance": 100},
                }
            ],
            "needs_authentication": True,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidAppData(response_data)
        self.assertTrue(self.flag_5.code in list(ff["code"] for ff in response_data["feature_flags"]))
        with_configuration = next((x for x in response_data["feature_flags"] if x["code"] == self.flag_5.code), None)
        self.assertEqual(100, with_configuration["configuration"]["distance"])

    def test_app_update_with_wrong_configuration(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_5.id,
                    "name": self.flag_5.name,
                    "code": self.flag_5.code,
                    "configuration": {"dist": 100},
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

    def test_app_update_with_all_configuration_types(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_6.id,
                    "name": self.flag_6.name,
                    "code": self.flag_6.code,
                    "configuration": {
                        "int": 123,
                        "long": 123,
                        "number": 123,
                        "float": 123.0,
                        "double": 123.0,
                        "decimal": 123.0,
                        "url": "http://www.perdu.com",
                        "text": "some text",
                        "str": "some text",
                        "string": "some text",
                    },
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)

    def test_app_update_with_wrong_int_type(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_6.id,
                    "name": self.flag_6.name,
                    "code": self.flag_6.code,
                    "configuration": {
                        "int": "test",
                        "long": 123,
                        "number": 123,
                        "float": 123.0,
                        "double": 123.0,
                        "decimal": 123.0,
                        "url": "http://www.perdu.com",
                        "text": "some text",
                        "str": "some text",
                        "string": "some text",
                    },
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

    def test_app_update_with_wrong_float_type(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_6.id,
                    "name": self.flag_6.name,
                    "code": self.flag_6.code,
                    "configuration": {
                        "int": 123,
                        "long": 123,
                        "number": 123,
                        "float": "123.G",
                        "double": 123.0,
                        "decimal": 123.0,
                        "url": "http://www.perdu.com",
                        "text": "some text",
                        "str": "some text",
                        "string": "some text",
                    },
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

    def test_app_update_with_wrong_string_type(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_6.id,
                    "name": self.flag_6.name,
                    "code": self.flag_6.code,
                    "configuration": {
                        "int": 123,
                        "long": 123,
                        "number": 123,
                        "float": "123.0",
                        "double": 123.0,
                        "decimal": 123.0,
                        "url": "http://www.perdu.com",
                        "text": 123,
                        "str": "some text",
                        "string": "some text",
                    },
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 200)

    def test_app_update_with_bad_url(self):
        candidate_app = {
            "name": "This is a newly updated app",
            "feature_flags": [
                {
                    "id": self.flag_6.id,
                    "name": self.flag_6.name,
                    "code": self.flag_6.code,
                    "configuration": {
                        "int": 123,
                        "long": 123,
                        "number": 123,
                        "float": 123.0,
                        "double": 123.0,
                        "decimal": 123.0,
                        "url": "htp://wrong.scheme.com",
                        "text": "some text",
                        "str": "some text",
                        "string": "some text",
                    },
                }
            ],
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/apps/{self.project_1.app_id}/", candidate_app, format="json")
        self.assertJSONResponse(response, 400)

    def assertValidAppData(self, app_data: typing.Mapping) -> None:
        self.assertHasField(app_data, "id", str)
        self.assertHasField(app_data, "name", str)
        self.assertHasField(app_data, "feature_flags", list)
        self.assertHasField(app_data, "min_version", int, optional=True)
        self.assertHasField(app_data, "needs_authentication", bool)
        self.assertHasField(app_data, "created_at", float)
        self.assertHasField(app_data, "updated_at", float)
