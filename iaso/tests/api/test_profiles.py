import typing

from django.contrib.gis.geos import Polygon, Point, MultiPolygon
from django.test import tag

from iaso.test import APITestCase
from iaso import models as m


class ProfileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = m.Account.objects.create(name="Global Health Initiative")

        cls.jane = cls.create_user_with_profile(
            username="janedoe", account=cls.ghi, permissions=["iaso_forms"]
        )
        cls.john = cls.create_user_with_profile(
            username="johndoe", account=cls.ghi, is_superuser=True
        )
        cls.jim = cls.create_user_with_profile(
            username="jim", account=cls.ghi, permissions=["iaso_forms", "iaso_users"]
        )

        # TODO : make the org unit creations shorter and reusable
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=cls.ghi,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        cls.jedi_squad = m.OrgUnitType.objects.create(
            name="Jedi Squad", short_name="Jds"
        )
        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(
            Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])
        )
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.ghi.default_version = sw_version_1
        cls.ghi.save()

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

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
        self.assertEqual(response_data["user_name"], "janedoe")
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
        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "johndoe")

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
        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "janedoe")
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

    def assertValidProfileListData(
        self, list_data: typing.Mapping, expected_length: int, paginated: bool = False
    ):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="profiles",
            paginated=paginated,
        )

        for profile_data in list_data["profiles"]:
            self.assertValidProfileData(profile_data)

    @tag("iaso_only")
    def test_create_profile_no_perm(self):
        self.client.force_authenticate(self.jane)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        response = self.client.post("/api/profiles/", data=data, format="json")

        self.assertEqual(response.status_code, 403)

    @tag("iaso_only")
    def test_create_profile_duplicate_user(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "janedoe",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertEqual(response_data["errorKey"], "user_name")

    @tag("iaso_only")
    def test_create_profile_then_delete(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "unittest_user_name")
        self.assertEqual(response_data["is_superuser"], False)

        profile = m.Profile.objects.get(pk=response_data["id"])
        user = profile.user
        self.assertEqual(user.username, data["user_name"])
        self.assertEqual(user.first_name, data["first_name"])
        self.assertQuerysetEqual(user.user_permissions.all(), [])
        self.assertEqual(m.User.objects.filter(username=data["user_name"]).count(), 1)
        # check that we have copied the account from the creator account
        self.assertEqual(profile.account, self.ghi)

        profile_id = profile.id
        user_id = user.id
        response = self.client.delete(f"/api/profiles/{profile_id}/")

        self.assertEqual(response.status_code, 200)
        self.assertQuerysetEqual(m.User.objects.filter(id=user_id), [])
        self.assertQuerysetEqual(m.Profile.objects.filter(id=profile_id), [])

    @tag("iaso_only")
    def test_create_profile_with_org_units_and_perms(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "org_units": [{"id": self.jedi_council_corruscant.id}],
            "permissions": ["iaso_forms"],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "unittest_user_name")
        self.assertEqual(response_data["is_superuser"], False)

        profile = m.Profile.objects.get(pk=response_data["id"])
        user = profile.user
        self.assertEqual(user.username, data["user_name"])
        self.assertEqual(user.first_name, data["first_name"])

        self.assertEqual(m.User.objects.filter(username=data["user_name"]).count(), 1)
        self.assertEqual(profile.account, self.ghi)

        self.assertQuerysetEqual(
            user.user_permissions.all(),
            ["<Permission: menupermissions | custom permission support | Formulaires>"],
        )
        org_units = profile.org_units.all()
        self.assertEqual(org_units.count(), 1)
        self.assertEqual(org_units[0].name, "Corruscant Jedi Council")

    def assertValidProfileData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "first_name", str)
        self.assertHasField(project_data, "last_name", str)
        self.assertHasField(project_data, "email", str)

    @tag("iaso_only")
    def test_delete_profile_no_perm(self):
        self.client.force_authenticate(self.jane)
        response = self.client.delete("/api/profiles/1/")

        self.assertEqual(response.status_code, 403)
