import typing

from itertools import chain

from django.contrib.auth.models import Permission

from hat.menupermissions.constants import FEATUREFLAGES_TO_EXCLUDE
from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_PROJECTS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
)
from iaso.test import APITestCase


class ProjectsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health Initiative")
        wha = m.Account.objects.create(name="Worldwide Health Aid")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=[CORE_FORMS_PERMISSION])
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=[CORE_FORMS_PERMISSION])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=ghi)
        # Only this user has the project-specific permission required to write projects.
        cls.project_admin = cls.create_user_with_profile(
            username="projectadmin", account=ghi, permissions=[CORE_PROJECTS_PERMISSION]
        )

        cls.project_1 = m.Project.objects.create(
            name="Project 1",
            app_id="org.ghi.p1",
            account=ghi,
            color="#FF5733",
            description="Project 1 description",
        )
        cls.flag_a = m.FeatureFlag.objects.create(name="A feature", code="a_feature")
        cls.project_1.feature_flags.set([cls.flag_a])
        cls.project_2 = m.Project.objects.create(name="Project 2", app_id="org.ghi.p2", account=ghi)

        # Feature flags used by the project write tests.
        cls.flag_require_auth = m.FeatureFlag.objects.get(code=m.FeatureFlag.REQUIRE_AUTHENTICATION)
        cls.flag_requires_auth = m.FeatureFlag.objects.create(
            code="FEATURE_FLAG_THAT_REQUIRES_AUTHENTICATION",
            name="Has a dependency on 'REQUIRE_AUTHENTICATION'",
            requires_authentication=True,
        )
        cls.flag_config = m.FeatureFlag.objects.create(
            code="with_configuration",
            name="With configuration",
            configuration_schema={"distance": {"type": "int", "description": "Something", "default": 1}},
        )
        cls.flag_all_types = m.FeatureFlag.objects.create(
            code="with_all_configuration_types",
            name="With all configuration types",
            configuration_schema={
                "int": {"type": "int", "description": "An int", "default": 1},
                "long": {"type": "long", "description": "A long", "default": 1},
                "number": {"type": "number", "description": "A number", "default": 1},
                "float": {"type": "float", "description": "A float", "default": 1},
                "double": {"type": "double", "description": "A double", "default": 1},
                "decimal": {"type": "decimal", "description": "A decimal", "default": 1},
                "url": {"type": "url", "description": "A url", "default": 1},
                "text": {"type": "text", "description": "A text", "default": 1},
                "str": {"type": "str", "description": "A str", "default": 1},
                "string": {"type": "string", "description": "A string", "default": 1},
            },
        )

        # Forms used by the project write tests. `form_in_account` is reachable from the user's
        # account (linked to project_1), `form_other` is linked to no project of the account.
        cls.form_in_account = m.Form.objects.create(name="Form in account")
        cls.project_1.forms.add(cls.form_in_account)
        cls.form_other = m.Form.objects.create(name="Orphan form")

    def setUp(self):
        """Clean up any feature flags created by previous tests to ensure isolation"""
        # Clean up MOBILE_NO_ORG_UNIT feature flag if it exists
        m.FeatureFlag.objects.filter(code="MOBILE_NO_ORG_UNIT").delete()

        # Clean up SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG account feature flag if it exists
        m.AccountFeatureFlag.objects.filter(code="SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG").delete()

        # Clear any account feature flags that might have been added
        self.jane.iaso_profile.account.feature_flags.clear()

    def test_projects_list_without_auth(self):
        """GET /projects/ without auth should result in a 401"""

        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 401)

    def test_projects_list_no_permission(self):
        """GET /projects/ with auth. User without the iaso_forms permission can list project"""

        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 2)

    def test_projects_list_empty_for_user(self):
        """GET /projects/ with a user that has no access to any project"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 0)

    def test_projects_list_ok(self):
        """GET /projects/ happy path: we expect two results"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 2)
        # Verify color is included
        self.assertIn("color", response.json()["projects"][0])
        self.assertEqual(response.json()["projects"][0]["color"], "#FF5733")
        self.assertIn("description", response.json()["projects"][0])
        self.assertEqual(response.json()["projects"][0]["description"], "Project 1 description")

    def test_projects_list_query_count(self):
        """Ensure the projects list query count stays constant regardless of the number of projects.

        Expected 3 queries:
          1. resolve request.user's profile/account (filter on account),
          2. fetch the projects page,
          3. prefetch projectfeatureflags_set (+ featureflag) in a single query.
        A regression introducing an N+1 on feature flags would bump this count.
        """
        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(3):
            response = self.client.get("/api/projects/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 2)

    def test_projects_list_filter_by_app_id(self):
        """GET /projects/?app_id= should return only the matching project."""
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/projects/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 1)
        self.assertEqual(response.json()["projects"][0]["app_id"], self.project_1.app_id)

    def test_projects_list_filter_by_nonexistent_app_id(self):
        """GET /projects/?app_id= with unknown value should return empty list."""
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/?app_id=org.ghi.nope")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 0)

    def test_projects_list_filter_by_app_id_with_restricted_user(self):
        """GET /projects/?app_id= respects project restrictions."""
        user = self.jane
        project = m.Project.objects.create(
            name="Restricted", app_id="restricted.app", account=user.iaso_profile.account
        )
        user.iaso_profile.projects.set([project])
        self.client.force_authenticate(user)

        # Can access the restricted project
        response = self.client.get(f"/api/projects/?app_id={project.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 1)
        self.assertEqual(response.json()["projects"][0]["app_id"], project.app_id)

        # Cannot access project_1 because it's not in user's projects
        response = self.client.get(f"/api/projects/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 0)

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
        # Verify color is included
        self.assertIn("color", response_data["projects"][0])
        self.assertEqual(response_data["projects"][0]["color"], "#FF5733")
        self.assertIn("description", response_data["projects"][0])
        self.assertEqual(response_data["projects"][0]["description"], "Project 1 description")

    def test_projects_list_ordering(self):
        """GET /projects/?order=<field> orders by the requested field, both ascending and descending."""
        account = self.jane.iaso_profile.account
        # The shared fixture has id order == name order == app_id order, so an ascending
        # order assertion would pass even if the `order` param were ignored (the default
        # is `order = ["id"]`). Add a third project that breaks this coincidence so that
        # id order, name order and app_id order are all mutually distinct.
        m.Project.objects.create(name="Middle project", app_id="org.ghi.p15", account=account)
        self.client.force_authenticate(self.jane)

        for field in ("name", "-name", "app_id", "-app_id"):
            key = field.lstrip("-")
            # Compute the expected order independently from the DB instead of re-sorting the response.
            expected = list(
                m.Project.objects.filter(account=account)
                .filter_on_user_projects(self.jane)
                .order_by(field)
                .values_list(key, flat=True)
            )
            response = self.client.get(f"/api/projects/?order={field}")
            self.assertJSONResponse(response, 200)
            actual = [project[key] for project in response.json()["projects"]]
            self.assertEqual(actual, expected, f"order={field}")

    def test_projects_list_bypass_restrictions_disabled(self):
        """GET /projects/?bypass_restrictions=0 behaves like the default (no bypass)."""
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/?bypass_restrictions=0")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 2)

    def test_projects_list_pagination_returns_distinct_pages(self):
        """GET /projects/ pagination returns the expected, distinct project on each page."""
        self.client.force_authenticate(self.jane)
        expected_ids = list(
            m.Project.objects.filter(account=self.jane.iaso_profile.account).order_by("id").values_list("id", flat=True)
        )

        response = self.client.get("/api/projects/?limit=1&page=1")
        self.assertJSONResponse(response, 200)
        page_1 = response.json()
        self.assertValidProjectListData(page_1, 1, paginated=True)
        self.assertEqual(page_1["page"], 1)
        self.assertEqual(page_1["projects"][0]["id"], expected_ids[0])

        response = self.client.get("/api/projects/?limit=1&page=2")
        self.assertJSONResponse(response, 200)
        page_2 = response.json()
        self.assertValidProjectListData(page_2, 1, paginated=True)
        self.assertEqual(page_2["page"], 2)
        self.assertEqual(page_2["projects"][0]["id"], expected_ids[1])
        self.assertNotEqual(page_1["projects"][0]["id"], page_2["projects"][0]["id"])

    def test_feature_flags_list_paginated(self):
        """GET /featureflags/ paginated happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/featureflags/?limit=1&page=1", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidFeatureFlagListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], m.FeatureFlag.objects.count())
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], m.FeatureFlag.objects.count())

    def test_projects_list_bypass_restrictions(self):
        user = self.jane
        project = m.Project.objects.create(name="Project", app_id="project.foo", account=user.iaso_profile.account)
        self.client.force_authenticate(user)

        # Projects list should be restricted by default.
        user.iaso_profile.projects.set([project])
        self.assertFalse(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 1)

        # You should NOT be able to bypass restrictions if you're not an admin.
        response = self.client.get("/api/projects/?bypass_restrictions=1")
        json_response = self.assertJSONResponse(response, 403)
        self.assertEqual(
            json_response, {"detail": f"{CORE_USERS_ADMIN_PERMISSION} permission is required to access all projects."}
        )

        # You should be able to bypass restrictions if you're admin.
        user.user_permissions.add(Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.codename))
        del user._perm_cache
        del user._user_perm_cache
        self.assertTrue(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))
        response = self.client.get("/api/projects/?bypass_restrictions=1")
        self.assertJSONResponse(response, 200)
        total_projects_for_account = m.Project.objects.filter(account=user.iaso_profile.account).count()
        self.assertValidProjectListData(response.json(), total_projects_for_account)

    def test_feature_flags_list_ok(self):
        """GET /featureflags/ returns the feature flags, including the ones created in the fixture."""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/featureflags/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidFeatureFlagListData(response.json(), m.FeatureFlag.objects.count())
        # Assert on actual content, not only a DB-derived count: the flags created in the
        # fixture must be present in the payload.
        returned_codes = {flag["code"] for flag in response.json()["featureflags"]}
        expected_codes = {
            self.flag_a.code,
            self.flag_requires_auth.code,
            self.flag_config.code,
            self.flag_all_types.code,
            m.FeatureFlag.REQUIRE_AUTHENTICATION,
        }
        self.assertTrue(
            expected_codes.issubset(returned_codes),
            f"missing feature flags in response: {expected_codes - returned_codes}",
        )

    def test_feature_flags_list_except_no_activated_modules(self):
        """GET /featureflags/except_no_activated_modules happy path: we expect one result"""
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            "/api/featureflags/except_no_activated_modules/", headers={"Content-Type": "application/json"}
        )

        self.assertJSONResponse(response, 200)
        excluded_feature_flags = list(
            chain.from_iterable([featureflag for featureflag in FEATUREFLAGES_TO_EXCLUDE.values()])
        )
        self.assertValidFeatureFlagListData(
            response.json(), m.FeatureFlag.objects.count() - len(excluded_feature_flags)
        )

    def test_feature_flags_except_no_activated_modules_filters_mobile_stock_without_stock_module(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            "/api/featureflags/except_no_activated_modules/", headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)

        feature_flag_codes = [flag["code"] for flag in response.json()["featureflags"]]
        self.assertNotIn("MOBILE_STOCK", feature_flag_codes)

    def test_feature_flags_except_no_activated_modules_shows_mobile_stock_with_stock_module(self):
        account = self.jane.iaso_profile.account
        account.modules = ["STOCK_MANAGEMENT"]
        account.save()

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            "/api/featureflags/except_no_activated_modules/", headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)

        feature_flag_codes = [flag["code"] for flag in response.json()["featureflags"]]
        self.assertIn("MOBILE_STOCK", feature_flag_codes)

    def test_feature_flags_filter_mobile_no_org_unit_without_flag(self):
        """Test that MOBILE_NO_ORG_UNIT is filtered out when account doesn't have SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG"""
        # Create the MOBILE_NO_ORG_UNIT feature flag if it doesn't exist
        mobile_no_org_unit_flag, created = m.FeatureFlag.objects.get_or_create(
            code="MOBILE_NO_ORG_UNIT", defaults={"name": "Mobile No Org Unit"}
        )

        # Ensure the account doesn't have the required feature flag
        self.jane.iaso_profile.account.feature_flags.clear()

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/featureflags/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        # Verify MOBILE_NO_ORG_UNIT is not in the response
        response_data = response.json()
        feature_flag_codes = [flag["code"] for flag in response_data["featureflags"]]
        self.assertNotIn("MOBILE_NO_ORG_UNIT", feature_flag_codes)

    def test_feature_flags_show_mobile_no_org_unit_with_flag(self):
        """Test that MOBILE_NO_ORG_UNIT is included when account has SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG"""
        # Create the MOBILE_NO_ORG_UNIT feature flag if it doesn't exist
        mobile_no_org_unit_flag, created = m.FeatureFlag.objects.get_or_create(
            code="MOBILE_NO_ORG_UNIT", defaults={"name": "Mobile No Org Unit"}
        )

        # Create the required account feature flag if it doesn't exist
        show_mobile_flag, created = m.AccountFeatureFlag.objects.get_or_create(
            code="SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG",
            defaults={"name": "Show Mobile No Org Unit Project Feature Flag"},
        )

        # Add the required feature flag to the account
        self.jane.iaso_profile.account.feature_flags.add(show_mobile_flag)

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/featureflags/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        # Verify MOBILE_NO_ORG_UNIT is in the response
        response_data = response.json()
        feature_flag_codes = [flag["code"] for flag in response_data["featureflags"]]
        self.assertIn("MOBILE_NO_ORG_UNIT", feature_flag_codes)

    def test_feature_flags_except_no_activated_modules_filter_mobile_no_org_unit(self):
        """Test that MOBILE_NO_ORG_UNIT is filtered out in except_no_activated_modules when account doesn't have the flag"""
        # Create the MOBILE_NO_ORG_UNIT feature flag if it doesn't exist
        mobile_no_org_unit_flag, created = m.FeatureFlag.objects.get_or_create(
            code="MOBILE_NO_ORG_UNIT", defaults={"name": "Mobile No Org Unit"}
        )

        # Ensure the account doesn't have the required feature flag
        self.jane.iaso_profile.account.feature_flags.clear()

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            "/api/featureflags/except_no_activated_modules/", headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)

        # Verify MOBILE_NO_ORG_UNIT is not in the response
        response_data = response.json()
        feature_flag_codes = [flag["code"] for flag in response_data["featureflags"]]
        self.assertNotIn("MOBILE_NO_ORG_UNIT", feature_flag_codes)

    def test_feature_flags_except_no_activated_modules_show_mobile_no_org_unit_with_flag(self):
        """Test that MOBILE_NO_ORG_UNIT is included in except_no_activated_modules when account has the flag"""
        # Create the MOBILE_NO_ORG_UNIT feature flag if it doesn't exist
        mobile_no_org_unit_flag, created = m.FeatureFlag.objects.get_or_create(
            code="MOBILE_NO_ORG_UNIT", defaults={"name": "Mobile No Org Unit"}
        )

        # Create the required account feature flag if it doesn't exist
        show_mobile_flag, created = m.AccountFeatureFlag.objects.get_or_create(
            code="SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG",
            defaults={"name": "Show Mobile No Org Unit Project Feature Flag"},
        )

        # Add the required feature flag to the account
        self.jane.iaso_profile.account.feature_flags.add(show_mobile_flag)

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            "/api/featureflags/except_no_activated_modules/", headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)

        # Verify MOBILE_NO_ORG_UNIT is in the response
        response_data = response.json()
        feature_flag_codes = [flag["code"] for flag in response_data["featureflags"]]
        self.assertIn("MOBILE_NO_ORG_UNIT", feature_flag_codes)

    def test_projects_retrieve_without_auth(self):
        """GET /projects/<project_id> without auth should result in a 401"""

        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 401)

    def test_projects_retrieve_wrong_auth(self):
        """GET /projects/<project_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.john)
        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_projects_retrieve_not_found(self):
        """GET /projects/<project_id>: id does not exist"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/292003030/")
        self.assertJSONResponse(response, 404)

    def test_projects_retrieve_ok(self):
        """GET /projects/<project_id> happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidProjectData(response_data)
        self.assertEqual(1, len(response_data["feature_flags"]))
        self.assertValidFeatureFlagData(response_data["feature_flags"][0])
        # Verify color is included
        self.assertIn("color", response_data)
        self.assertEqual(response_data["color"], "#FF5733")
        self.assertIn("description", response_data)
        self.assertEqual(response_data["description"], "Project 1 description")

    def test_projects_create_without_permission(self):
        """POST /projects/ requires the project-specific permission CORE_PROJECTS_PERMISSION."""
        self.client.force_authenticate(self.jane)
        response = self.client.post(
            "/api/projects/",
            data={"name": "Nope", "app_id": "org.ghi.nope", "feature_flags": []},
            format="json",
        )
        self.assertJSONResponse(response, 403)

    def test_projects_create_ok(self):
        """POST /projects/ happy path"""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "name": "New Project",
            "app_id": "org.ghi.new",
            "description": "A new project",
            "feature_flags": [{"id": self.flag_a.id, "name": self.flag_a.name, "code": self.flag_a.code}],
            "needs_authentication": False,
            "color": "#123456",
        }
        response = self.client.post("/api/projects/", data=payload, format="json")
        self.assertJSONResponse(response, 201)
        response_data = response.json()
        self.assertValidProjectData(response_data)
        self.assertEqual("org.ghi.new", response_data["app_id"])
        self.assertEqual("A new project", response_data["description"])
        self.assertEqual(1, len(response_data["feature_flags"]))
        self.assertEqual("#123456", response_data["color"])
        self.assertFalse(response_data["needs_authentication"])

        project = m.Project.objects.get(app_id="org.ghi.new")
        self.assertEqual(self.project_admin.iaso_profile.account, project.account)
        self.assertEqual("#123456", project.color)
        self.assertFalse(project.needs_authentication)

    def test_projects_create_duplicate_app_id(self):
        """POST /projects/ with an app_id already in use is rejected"""
        self.client.force_authenticate(self.project_admin)
        payload = {"name": "Dup", "app_id": self.project_1.app_id, "feature_flags": []}
        response = self.client.post("/api/projects/", data=payload, format="json")
        self.assertJSONResponse(response, 400)
        self.assertIn("app_id", response.json())

    def test_projects_update_without_permission(self):
        """PUT /projects/<id> requires the project-specific permission CORE_PROJECTS_PERMISSION."""
        self.client.force_authenticate(self.jane)
        payload = {"name": "x", "app_id": self.project_1.app_id, "feature_flags": []}
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 403)

    def test_projects_update_keeps_same_app_id(self):
        """PUT /projects/<id> resending the project's own app_id must not raise 'App id already used'."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1 renamed",
            "app_id": self.project_1.app_id,  # unchanged
            "description": "updated description",
            "feature_flags": [],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)
        self.project_1.refresh_from_db()
        self.assertEqual("Project 1 renamed", self.project_1.name)
        self.assertEqual("org.ghi.p1", self.project_1.app_id)

    def test_projects_update_fails_if_duplicate_app_id(self):
        """PUT /projects/<id> changing app_id to one used by another project is rejected"""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_2.app_id,
            "feature_flags": [],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)
        self.assertIn("app_id", response.json())

    def test_projects_update_flag_requires_authentication(self):
        """A flag with requires_authentication needs REQUIRE_AUTHENTICATION alongside it."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_requires_auth.id,
                    "name": self.flag_requires_auth.name,
                    "code": self.flag_requires_auth.code,
                }
            ],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)

        payload["feature_flags"].append(
            {
                "id": self.flag_require_auth.id,
                "name": self.flag_require_auth.name,
                "code": self.flag_require_auth.code,
            }
        )
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)
        codes = [ff["code"] for ff in response.json()["feature_flags"]]
        self.assertIn(m.FeatureFlag.REQUIRE_AUTHENTICATION, codes)
        self.assertIn(self.flag_requires_auth.code, codes)

    def test_projects_update_auto_commit_require_auth(self):
        """needs_authentication=True auto-adds the REQUIRE_AUTHENTICATION flag."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [{"id": self.flag_a.id, "name": self.flag_a.name, "code": self.flag_a.code}],
            "needs_authentication": True,
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertTrue(response_data["needs_authentication"])
        self.assertIn(m.FeatureFlag.REQUIRE_AUTHENTICATION, [ff["code"] for ff in response_data["feature_flags"]])

    def test_projects_update_configuration_missing(self):
        """A feature flag with a configuration schema requires a configuration."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {"id": self.flag_config.id, "name": self.flag_config.name, "code": self.flag_config.code}
            ],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)

    def test_projects_update_configuration_ok(self):
        """A valid configuration is accepted and persisted."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_config.id,
                    "name": self.flag_config.name,
                    "code": self.flag_config.code,
                    "configuration": {"distance": 100},
                }
            ],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)
        with_configuration = next(ff for ff in response.json()["feature_flags"] if ff["code"] == self.flag_config.code)
        self.assertEqual(100, with_configuration["configuration"]["distance"])

    def test_projects_update_configuration_wrong_key(self):
        """A configuration missing a required key is rejected."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_config.id,
                    "name": self.flag_config.name,
                    "code": self.flag_config.code,
                    "configuration": {"dist": 100},
                }
            ],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)

    def test_projects_update_configuration_wrong_type(self):
        """A configuration value of the wrong type is rejected."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_config.id,
                    "name": self.flag_config.name,
                    "code": self.flag_config.code,
                    "configuration": {"distance": "not-an-int"},
                }
            ],
        }
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)

    def test_projects_update_all_configuration_types(self):
        """All supported configuration types are accepted."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_all_types.id,
                    "name": self.flag_all_types.name,
                    "code": self.flag_all_types.code,
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
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)

    def test_projects_update_configuration_bad_url(self):
        """A configuration url with a non-http(s) scheme is rejected."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_1.id,
            "name": "Project 1",
            "app_id": self.project_1.app_id,
            "feature_flags": [
                {
                    "id": self.flag_all_types.id,
                    "name": self.flag_all_types.name,
                    "code": self.flag_all_types.code,
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
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)

    def test_projects_update_forms_ok(self):
        """PUT /projects/<id> can assign forms reachable from the user's account."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_2.id,
            "name": "Project 2",
            "app_id": self.project_2.app_id,
            "feature_flags": [],
            "forms": [self.form_in_account.id],
        }
        response = self.client.put(f"/api/projects/{self.project_2.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 200)
        self.assertIn(self.form_in_account, list(self.project_2.forms.all()))

    def test_projects_update_forms_not_in_account(self):
        """PUT /projects/<id> rejects forms not associated to the user's account."""
        self.client.force_authenticate(self.project_admin)
        payload = {
            "id": self.project_2.id,
            "name": "Project 2",
            "app_id": self.project_2.app_id,
            "feature_flags": [],
            "forms": [self.form_other.id],
        }
        response = self.client.put(f"/api/projects/{self.project_2.id}/", data=payload, format="json")
        self.assertJSONResponse(response, 400)
        self.assertIn("forms", response.json())

    def test_projects_partial_update_color_only(self):
        """PATCH /projects/<id> updates a single field without resending feature_flags."""
        self.client.force_authenticate(self.project_admin)
        self.assertEqual(1, self.project_1.feature_flags.count())

        response = self.client.patch(f"/api/projects/{self.project_1.id}/", data={"color": "#000000"}, format="json")
        self.assertJSONResponse(response, 200)

        self.project_1.refresh_from_db()
        self.assertEqual("#000000", self.project_1.color)
        # Omitting `feature_flags` from a PATCH must not wipe the existing ones.
        self.assertEqual(1, self.project_1.feature_flags.count())

    def test_projects_partial_update_preserves_needs_authentication(self):
        """PATCH of an unrelated field must not reset needs_authentication when feature_flags is omitted."""
        self.client.force_authenticate(self.project_admin)
        self.project_1.feature_flags.set([self.flag_a, self.flag_require_auth])
        self.project_1.needs_authentication = True
        self.project_1.save()

        response = self.client.patch(f"/api/projects/{self.project_1.id}/", data={"color": "#000000"}, format="json")
        self.assertJSONResponse(response, 200)

        self.project_1.refresh_from_db()
        self.assertEqual("#000000", self.project_1.color)
        self.assertTrue(self.project_1.needs_authentication)
        codes = set(self.project_1.feature_flags.values_list("code", flat=True))
        self.assertIn(m.FeatureFlag.REQUIRE_AUTHENTICATION, codes)

    def test_projects_delete_not_allowed(self):
        """DELETE /projects/<project_id>: not exposed on the projects endpoint"""
        self.client.force_authenticate(self.project_admin)
        response = self.client.delete(f"/api/projects/{self.project_1.id}/", format="json")
        self.assertJSONResponse(response, 405)

    def test_project_color_in_api(self):
        """Test that color field is properly handled in API responses"""
        self.client.force_authenticate(self.jane)

        # Test color in list response
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertIn("color", response.json()["projects"][0])
        self.assertEqual(response.json()["projects"][0]["color"], "#FF5733")

        # Test color in detail response
        response = self.client.get(f"/api/projects/{self.project_1.id}/")
        self.assertJSONResponse(response, 200)
        self.assertIn("color", response.json())
        self.assertEqual(response.json()["color"], "#FF5733")

    def test_qr_code_unauthenticated(self):
        """GET /projects/<project_id>/qr_code/: return the proper QR code"""
        response = self.client.get(f"/api/projects/{self.project_1.id}/qr_code/")
        self.assertEqual(401, response.status_code)

    def test_qr_code(self):
        """GET /projects/<project_id>/qr_code/: return the proper QR code"""
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/projects/{self.project_1.id}/qr_code/")
        self.assertEqual(200, response.status_code)
        self.assertEqual("image/png", response["Content-Type"])

    def test_qr_code_not_found(self):
        """GET /projects/<project_id>/qr_code/: return 404"""
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/projects/WRONG/qr_code/")
        self.assertEqual(404, response.status_code)

    def assertValidProjectListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="projects", paginated=paginated
        )

        for project_data in list_data["projects"]:
            self.assertValidProjectData(project_data)

    def assertValidFeatureFlagListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="featureflags", paginated=paginated
        )

        for feature_flags_data in list_data["featureflags"]:
            self.assertValidFeatureFlagData(feature_flags_data)

    def assertValidFeatureFlagData(self, feature_flag_data: typing.Mapping):
        self.assertHasField(feature_flag_data, "id", int)
        self.assertHasField(feature_flag_data, "name", str)
        self.assertHasField(feature_flag_data, "code", str)
        self.assertHasField(feature_flag_data, "description", str)
        self.assertHasField(feature_flag_data, "created_at", float)
        self.assertHasField(feature_flag_data, "updated_at", float)

    def assertValidProjectData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "name", str)
        self.assertHasField(project_data, "app_id", str)
        self.assertHasField(project_data, "feature_flags", list)
        # Color is optional, so we only check its type if it exists
        if "color" in project_data:
            self.assertIsInstance(project_data["color"], str)
        self.assertHasField(project_data, "description", str)
        for feature_flag_data in project_data["feature_flags"]:
            self.assertValidFeatureFlagData(feature_flag_data)
