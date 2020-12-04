import typing
from django.test import tag

from iaso.test import APITestCase
from iaso import models as m


class ProfileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health Initiative")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_forms"])
        cls.john = cls.create_user_with_profile(username="johndoe", account=ghi, is_superuser=True)
        cls.jim = cls.create_user_with_profile(username="jim", account=ghi, permissions=["iaso_forms", "iaso_users"])

    @tag("iaso_only")
    def test_profile_me_without_auth(self):
        """GET /profiles/me/ without auth should result in a 403"""

        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_profile_me_ok(self):
        """GET /profiles/me/ with auth"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertHasField(response_data, "account", dict)
        self.assertHasField(response_data, "permissions", list)
        self.assertHasField(response_data, "is_superuser", bool)
        self.assertHasField(response_data, "org_units", list)

    @tag("iaso_only")
    def test_profile_me_superuser_ok(self):
        """GET /profiles/me/ with auth (superuser)"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileData(response.json())

    @tag("iaso_only")
    def test_profile_list_no_auth(self):
        """GET /profiles/ without auth -> 403"""

        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_profile_list_read_only_permissions(self):
        """GET /profiles/ with auth (user has read only permissions)"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        profile_url = "/api/profiles/%s/" % self.jane.iaso_profile.id
        response = self.client.get(profile_url)
        self.assertJSONResponse(response, 200)
        response = self.client.patch(profile_url)
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_profile_list_ok(self):
        """GET /profiles/me/ with auth (user has the right permissions)"""

        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 3)

    @tag("iaso_only")
    def test_profile_list_superuser_ok(self):
        """GET /profiles/me/ with auth (superuser)"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 3)

    def assertValidProfileListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="profiles", paginated=paginated
        )

        for profile_data in list_data["profiles"]:
            self.assertValidProfileData(profile_data)

    def assertValidProfileData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "first_name", str)
        self.assertHasField(project_data, "last_name", str)
        self.assertHasField(project_data, "email", str)
