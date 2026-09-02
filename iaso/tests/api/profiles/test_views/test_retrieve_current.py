from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Project
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase
from iaso.utils.colors import DEFAULT_COLOR


class ProfileRetrieveCurrentAPITestCase(BaseProfileAPITestCase):
    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "ProfileRetrieveCurrent")

    def test_permissions(self):
        response = self.client.get(reverse("profiles-retrieve-current"))
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-retrieve-current"))
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.client.force_authenticate(self.john)
        response = self.client.get(reverse("profiles-retrieve-current"))
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(5):
            res = self.client.get(reverse("profiles-retrieve-current"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_retrieve_me_is_compatible_for_mobile(self):
        """
        Test to check that we have all the mandatory fields required for mobile
        """

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
        response = self.client.get(reverse("profiles-retrieve-current"))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)

        for k in ["id", "first_name", "last_name", "user_name", "email", "phone_number", "organization", "projects"]:
            self.assertIn(k, response_data)

        for k in ["id", "name", "app_id", "color"]:
            self.assertIn(k, response_data["projects"][0])

    def test_retrieve(self):
        """GET /profiles/me/ with auth"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-retrieve-current"))
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertEqual(
            res_data,
            {
                "id": self.jane.iaso_profile.pk,
                "first_name": "Jane",
                "user_name": "janedoe",
                "last_name": "Doe",
                "email": "",
                "permissions": ["iaso_forms"],
                "is_staff": False,
                "is_superuser": False,
                "language": "en",
                "organization": None,
                "user_id": self.jane.pk,
                "phone_number": "",
                "projects": [
                    {
                        "id": self.project.pk,
                        "name": "Hydroponic gardens",
                        "app_id": "stars.empire.agriculture.hydroponics",
                        "color": DEFAULT_COLOR,
                    }
                ],
                "org_units": [{"id": self.child_org_unit.pk, "name": "Corruscant Jedi Council"}],
            },
        )

    def test_retrieve_profile_me_no_profile(self):
        """GET /profiles/me/ with auth, but without profile
        The goal is to know that this call doesn't result in a 500 error
        """
        username = "I don't have a profile, i'm sad :("
        user_without_profile = get_user_model().objects.create(username=username)
        self.client.force_authenticate(user_without_profile)
        response = self.client.get(reverse("profiles-retrieve-current"))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_data["user_name"], username)
        self.assertEqual(response_data["first_name"], "")
        self.assertEqual(response_data["last_name"], "")
        self.assertEqual(response_data["user_id"], user_without_profile.id)
        self.assertEqual(response_data["email"], "")
        self.assertEqual(response_data["projects"], [])
        self.assertFalse(response_data["is_staff"])
        self.assertFalse(response_data["is_superuser"])
        self.assertNotIn("date_joined", response_data)
        self.assertIsNone(response_data["account"])
