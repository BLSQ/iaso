import typing

from itertools import chain

from django.contrib.auth.models import Permission

import iaso.permissions as core_permissions

from hat.menupermissions.constants import FEATUREFLAGES_TO_EXCLUDE
from iaso import models as m
from iaso.test import APITestCase


class ProjectsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health Initiative")
        wha = m.Account.objects.create(name="Worldwide Health Aid")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_forms"])
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=["iaso_forms"])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=ghi)

        cls.project_1 = m.Project.objects.create(name="Project 1", app_id="org.ghi.p1", account=ghi, color="#FF5733")
        flag = m.FeatureFlag.objects.create(name="A feature", code="a_feature")
        cls.project_1.feature_flags.set([flag])
        m.Project.objects.create(name="Project 2", app_id="org.ghi.p2", account=ghi)

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
        self.assertFalse(user.has_perm(core_permissions.USERS_ADMIN))
        response = self.client.get("/api/projects/")
        self.assertJSONResponse(response, 200)
        self.assertValidProjectListData(response.json(), 1)

        # You should NOT be able to bypass restrictions if you're not an admin.
        response = self.client.get("/api/projects/?bypass_restrictions=1")
        json_response = self.assertJSONResponse(response, 403)
        self.assertEqual(json_response, {"detail": "iaso.iaso_users permission is required to access all projects."})

        # You should be able to bypass restrictions if you're admin.
        user.user_permissions.add(Permission.objects.get(codename=core_permissions._USERS_ADMIN))
        del user._perm_cache
        del user._user_perm_cache
        self.assertTrue(user.has_perm(core_permissions.USERS_ADMIN))
        response = self.client.get("/api/projects/?bypass_restrictions=1")
        self.assertJSONResponse(response, 200)
        total_projects_for_account = m.Project.objects.filter(account=user.iaso_profile.account).count()
        self.assertValidProjectListData(response.json(), total_projects_for_account)

    def test_feature_flags_list_ok(self):
        """GET /featureflags/ happy path: we expect one result"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/featureflags/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidFeatureFlagListData(response.json(), m.FeatureFlag.objects.count())

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

    def test_projects_create(self):
        """POST /projects/: not authorized for now"""
        self.client.force_authenticate(self.jane)
        response = self.client.post("/api/projects/", data={}, format="json")
        self.assertJSONResponse(response, 405)

    def test_projects_update(self):
        """PUT /projects/<project_id>: not authorized for now"""
        self.client.force_authenticate(self.jane)
        response = self.client.put(f"/api/projects/{self.project_1.id}/", data={}, format="json")
        self.assertJSONResponse(response, 405)

    def test_projects_delete(self):
        """DELETE /projects/<project_id>: not authorized for now"""
        self.client.force_authenticate(self.jane)
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
        for feature_flag_data in project_data["feature_flags"]:
            self.assertValidFeatureFlagData(feature_flag_data)
