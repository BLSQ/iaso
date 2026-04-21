from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import AccountFeatureFlag, Project
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase
from iaso.utils.colors import DEFAULT_COLOR


class ProfileRetrieveAPITestCase(BaseProfileAPITestCase):
    def test_account_feature_flags_is_included(self):
        aff = AccountFeatureFlag.objects.create(code="shape", name="Can edit shape")
        AccountFeatureFlag.objects.create(code="not-used", name="this is not used")
        self.client.force_authenticate(self.jane)

        # no feature flag at first
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response_data)
        self.assertIn("account", response_data)
        self.assertEqual(response_data["account"]["feature_flags"], [])

        # add a feature flags
        self.account.feature_flags.add(aff)

        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response_data)

        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], ["shape"])

        # remove feature flags
        self.account.feature_flags.remove(aff)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response_data)
        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], [])

    def test_profile_retrieve_read_only_permissions(self):
        """GET /profiles/ with auth (user has read only permissions)"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.id}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "janedoe")

    def test_retrieve_profile_me_without_auth(self):
        """GET /profiles/me/ without auth should result in a 401"""
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        self.assertJSONResponse(response, 401)

    def test_retrieve_me_is_compatible_for_mobile(self):
        user = self.create_user_with_profile(
            first_name="Jane",
            last_name="Doe",
            username="janedoe2",
            account=self.account,
            permissions=[CORE_FORMS_PERMISSION],
        )
        project_1 = Project.objects.create(name="Project 1", app_id="project.1", account=self.account)
        user.iaso_profile.phone_number = "+32477123456"
        user.iaso_profile.country_code = "be"
        user.iaso_profile.projects.set([project_1])
        user.iaso_profile.save()

        self.client.force_authenticate(user)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response_data)

        for k in ["id", "first_name", "last_name", "user_name", "email", "phone_number", "organization", "projects"]:
            self.assertIn(k, response_data)

        for k in ["id", "name", "app_id"]:
            self.assertIn(k, response_data["projects"][0])

    def test_retrieve_profile_me_ok(self):
        """GET /profiles/me/ with auth"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)

        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "janedoe")
        self.assertHasField(response_data, "account", dict)
        self.assertHasField(response_data, "permissions", list)
        self.assertHasField(response_data, "is_superuser", bool)
        self.assertHasField(response_data, "org_units", list)
        self.assertEqual(response_data["color"], DEFAULT_COLOR)

    def test_retrieve_profile_me_no_profile(self):
        """GET /profiles/me/ with auth, but without profile
        The goal is to know that this call doesn't result in a 500 error
        """
        username = "I don't have a profile, i'm sad :("
        user_without_profile = get_user_model().objects.create(username=username)
        self.client.force_authenticate(user_without_profile)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_data["user_name"], username)
        self.assertEqual(response_data["first_name"], "")
        self.assertEqual(response_data["last_name"], "")
        self.assertEqual(response_data["user_id"], user_without_profile.id)
        self.assertEqual(response_data["email"], "")
        self.assertEqual(response_data["projects"], [])
        self.assertFalse(response_data["is_staff"])
        self.assertFalse(response_data["is_superuser"])
        self.assertIsNone(response_data["account"])

    def test_retrieve_profile_me_superuser_ok(self):
        """GET /profiles/me/ with auth (superuser)"""

        self.client.force_authenticate(self.john)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": "me"}))
        response_data = self.assertJSONResponse(response, 200)

        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "johndoe")

    # todo : write tests for retrieve , but not for "me"
