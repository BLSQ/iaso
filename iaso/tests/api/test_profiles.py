import typing

import numpy as np
import pandas as pd

from django.conf import settings
from django.contrib.gis.geos import Polygon, Point, MultiPolygon
from django.contrib.sites.models import Site
from django.core import mail
from django.contrib.auth.models import Group, Permission

from iaso import models as m
from iaso.models import Profile
from iaso.models.microplanning import Team
from iaso.test import APITestCase
from hat.menupermissions import models as permission


class ProfileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = m.Account.objects.create(name="Global Health Initiative")
        cls.another_account = m.Account.objects.create(name="Another account")

        # TODO : make the org unit creations shorter and reusable
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=cls.ghi,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.ghi.default_version = sw_version_1
        cls.ghi.save()

        cls.jedi_squad_1 = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="FooBarB4z00",
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_corruscant_child = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            parent=cls.jedi_council_corruscant,
        )

        cls.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )
        cls.group = Group.objects.create(name="user role")
        cls.group.permissions.add(cls.permission)
        cls.user_role = m.UserRole.objects.create(group=cls.group, account=cls.ghi)

        cls.group_another_account = Group.objects.create(name="user role with another account")
        cls.group_another_account.permissions.add(cls.permission)
        cls.user_role_another_account = m.UserRole.objects.create(
            group=cls.group_another_account, account=cls.another_account
        )

        # Users.
        cls.jane = cls.create_user_with_profile(username="janedoe", account=cls.ghi, permissions=[permission._FORMS])
        cls.john = cls.create_user_with_profile(username="johndoe", account=cls.ghi, is_superuser=True)
        cls.jim = cls.create_user_with_profile(
            username="jim", account=cls.ghi, permissions=[permission._FORMS, permission._USERS_ADMIN]
        )
        cls.jam = cls.create_user_with_profile(
            username="jam",
            account=cls.ghi,
            permissions=[permission._USERS_MANAGED],
            language="en",
        )
        cls.jom = cls.create_user_with_profile(username="jom", account=cls.ghi, permissions=[], language="fr")
        cls.jum = cls.create_user_with_profile(username="jum", account=cls.ghi, permissions=[], projects=[cls.project])

    def test_can_delete_dhis2_id(self):
        self.client.force_authenticate(self.john)
        jim = Profile.objects.get(user=self.jim)
        jim.dhis2_id = "fsdgdfsgsdg"
        jim.save()

        data = {
            "id": str(self.jim.id),
            "user_name": "jim",
            "first_name": "",
            "last_name": "",
            "email": "",
            "password": "",
            "permissions": [],
            "org_units": [],
            "language": "fr",
            "dhis2_id": "",
        }

        response = self.client.patch("/api/profiles/{0}/".format(jim.id), data=data, format="json")

        self.assertEqual(response.status_code, 200, response)

    def test_profile_me_without_auth(self):
        """GET /profiles/me/ without auth should result in a 403"""

        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 403)

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

    def test_profile_me_superuser_ok(self):
        """GET /profiles/me/ with auth (superuser)"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "johndoe")

    def test_profile_list_no_auth(self):
        """GET /profiles/ without auth -> 403"""

        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 403)

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

    def test_profile_list_ok(self):
        """GET /profiles/ with auth"""
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_export_as_csv(self):
        self.john.iaso_profile.org_units.set([self.jedi_squad_1, self.jedi_council_corruscant])

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/?csv=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")

        response_csv = response.getvalue().decode("utf-8")

        expected_csv = (
            "username,"
            "password,"
            "email,"
            "first_name,"
            "last_name,"
            "orgunit,"
            "orgunit__source_ref,"
            "profile_language,"
            "dhis2_id,"
            "permissions,"
            "user_roles,"
            "projects\r\n"
        )

        expected_csv += "janedoe,,,,,,,,,iaso_forms,,\r\n"
        expected_csv += (
            f'johndoe,,,,,"{self.jedi_squad_1.pk},{self.jedi_council_corruscant.pk}","PvtAI4RUMkr,FooBarB4z00",,,,,\r\n'
        )
        expected_csv += 'jim,,,,,,,,,"iaso_forms,iaso_users",,\r\n'
        expected_csv += "jam,,,,,,,en,,iaso_users_managed,,\r\n"
        expected_csv += "jom,,,,,,,fr,,,,\r\n"
        expected_csv += f"jum,,,,,,,,,,,{self.project.id}\r\n"

        self.assertEqual(response_csv, expected_csv)

    def test_profile_list_export_as_xlsx(self):
        self.john.iaso_profile.org_units.set([self.jedi_squad_1, self.jedi_council_corruscant])

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/?xlsx=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        excel_data = pd.read_excel(response.content, engine="openpyxl")

        excel_columns = list(excel_data.columns.ravel())
        self.assertEqual(
            excel_columns,
            [
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "orgunit",
                "orgunit__source_ref",
                "profile_language",
                "dhis2_id",
                "permissions",
                "user_roles",
                "projects",
            ],
        )

        data_dict = excel_data.replace({np.nan: None}).to_dict()
        self.assertDictEqual(
            data_dict,
            {
                "username": {0: "janedoe", 1: "johndoe", 2: "jim", 3: "jam", 4: "jom", 5: "jum"},
                "password": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "email": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "first_name": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "last_name": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "orgunit": {
                    0: None,
                    1: f"{self.jedi_squad_1.pk},{self.jedi_council_corruscant.pk}",
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                },
                "orgunit__source_ref": {
                    0: None,
                    1: "PvtAI4RUMkr,FooBarB4z00",
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                },
                "profile_language": {0: None, 1: None, 2: None, 3: "en", 4: "fr", 5: None},
                "dhis2_id": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "permissions": {
                    0: "iaso_forms",
                    1: None,
                    2: "iaso_forms,iaso_users",
                    3: "iaso_users_managed",
                    4: None,
                    5: None,
                },
                "user_roles": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None},
                "projects": {0: None, 1: None, 2: None, 3: None, 4: None, 5: self.project.id},
            },
        )

    def test_profile_list_user_admin_ok(self):
        """GET /profiles/ with auth (user has user admin permissions)"""
        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_superuser_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_user_manager_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_managed_user_only_superuser(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_managed_user_only_user_admin(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_managed_user_only_user_manager_no_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 5)

    def test_profile_list_managed_user_only_user_manager_with_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 1)

    def test_profile_list_managed_user_only_user_regular_user(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 0)

    def assertValidProfileListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="profiles",
            paginated=paginated,
        )

        for profile_data in list_data["profiles"]:
            self.assertValidProfileData(profile_data)

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

    def test_create_user_with_user_roles(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "user_permissions": ["iaso_forms"],
            "user_roles": [self.user_role.id],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        user_user_role = m.UserRole.objects.get(pk=response_data["user_roles"][0])
        self.assertValidProfileData(response_data)
        self.assertEqual(user_user_role.id, self.user_role.id)
        self.assertEqual(user_user_role.group.name, self.group.name)

    def test_create_user_with_not_allowed_user_roles(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "user_permissions": ["iaso_forms"],
            "user_roles": [self.user_role.id, self.user_role_another_account.id],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 404)

        response_data = response.json()
        self.assertEqual(response_data["detail"], "Not found.")

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

    def test_create_profile_duplicate_user_with_capitale_letters(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "JaNeDoE",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertEqual(response_data["errorKey"], "user_name")

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

    def test_create_profile_with_org_units_and_perms(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "org_units": [{"id": self.jedi_council_corruscant.id}],
            "user_permissions": ["iaso_forms"],
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

    def test_create_profile_with_send_email(self):
        site = Site.objects.first()
        site.name = "Iaso Dev"
        site.save()
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "userTest",
            "password": "",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "send_email_invitation": True,
            "email": "test@test.com",
        }

        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        domain = site.name
        from_email = settings.DEFAULT_FROM_EMAIL
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, f"Set up a password for your new account on {domain}")
        self.assertEqual(mail.outbox[0].from_email, from_email)
        self.assertEqual(mail.outbox[0].to, ["test@test.com"])

    def test_create_profile_with_no_password_and_not_send_email(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "userTest",
            "password": "",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "send_email_invitation": False,
            "email": "test@test.com",
        }

        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 400)

        response_data = response.json()
        self.assertEqual(response_data["errorKey"], "password")

    def assertValidProfileData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "first_name", str)
        self.assertHasField(project_data, "last_name", str)
        self.assertHasField(project_data, "email", str)

    def test_delete_profile_no_perm(self):
        self.client.force_authenticate(self.jane)
        response = self.client.delete("/api/profiles/1/")

        self.assertEqual(response.status_code, 403)

    def test_profile_error_dhis2_constraint(self):
        # Test for regression of IA-1249
        self.client.force_authenticate(self.jim)
        data = {"user_name": "unittest_user1", "password": "unittest_password", "dhis2_id": ""}
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200, response.content)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": ""}
        response = self.client.post("/api/profiles/", data=data, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        profile1 = m.Profile.objects.get(user__username="unittest_user1")
        profile2 = m.Profile.objects.get(user__username="unittest_user2")
        self.assertNotEqual(profile1.account_id, None)
        self.assertEqual(profile2.account_id, profile1.account_id)
        self.assertEqual(profile2.dhis2_id, None)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": "", "first_name": "test"}
        response = self.client.patch(f"/api/profiles/{profile2.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        profile2.refresh_from_db()
        self.assertEqual(profile2.dhis2_id, None)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": "test_dhis2_id"}
        response = self.client.patch(f"/api/profiles/{profile2.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        profile2.refresh_from_db()
        self.assertEqual(profile2.dhis2_id, "test_dhis2_id")

    def test_account_feature_flags_is_included(self):
        aff = m.AccountFeatureFlag.objects.create(code="shape", name="Can edit shape")
        m.AccountFeatureFlag.objects.create(code="not-used", name="this is not used")
        self.client.force_authenticate(self.jane)

        # no feature flag at first
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertIn("account", response_data)
        print(response_data["account"])
        self.assertEqual(response_data["account"]["feature_flags"], [])

        # add a feature flags
        self.ghi.feature_flags.add(aff)

        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertIn("account", response_data)
        print(response_data["account"])
        self.assertEqual(response_data["account"]["feature_flags"], ["shape"])

        # remove feature flags
        self.ghi.feature_flags.remove(aff)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertIn("account", response_data)
        print(response_data["account"])
        self.assertEqual(response_data["account"]["feature_flags"], [])

    def test_search_user_by_permissions(self):
        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/profiles/?permissions=iaso_users")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "jim")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_user_by_org_units(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.jedi_council_corruscant])

        response = self.client.get(f"/api/profiles/?location={self.jedi_council_corruscant.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_user_by_org_units_type(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.jedi_council_corruscant])

        response = self.client.get(f"/api/profiles/?orgUnitTypes={self.jedi_council.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_user_by_children_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.jedi_council_corruscant_child])

        response = self.client.get(
            f"/api/profiles/?location={self.jedi_council_corruscant.pk}&ouParent=false&ouChildren=true"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_user_by_parent_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.jedi_council_corruscant])

        response = self.client.get(
            f"/api/profiles/?location={self.jedi_council_corruscant_child.pk}&ouParent=true&ouChildren=false"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_by_ids(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/profiles/", {"ids": f"{self.jane.id},{self.jim.id}"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["profiles"]), 2)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(response.json()["profiles"][1]["user_name"], "jim")

    def test_search_by_teams(self):
        self.client.force_authenticate(self.jane)
        team1 = Team.objects.create(project=self.project, name="team1", manager=self.jane)
        team1.users.add(self.jane)
        team2 = Team.objects.create(project=self.project, name="team2", manager=self.jim)
        team2.users.add(self.jim)
        response = self.client.get(f"/api/profiles/", {"teams": f"{team1.pk},{team2.pk}"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["profiles"]), 2)
        user_names = [item["user_name"] for item in response.data["profiles"]]
        self.assertIn("janedoe", user_names)
        self.assertIn("jim", user_names)

    def test_user_with_managed_permission_can_update_profile_of_user_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "user_permissions": [permission._FORMS, permission._USERS_MANAGED],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_cannot_grant_user_admin_permission(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_permissions": [permission._FORMS, permission._USERS_MANAGED, permission._USERS_ADMIN],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_grant_user_admin_permission_through_user_roles(self):
        group = Group.objects.create(name="admin")
        group.permissions.set([Permission.objects.get(codename=permission._USERS_ADMIN)])
        role = m.UserRole.objects.create(account=self.ghi, group=group)
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_roles": [role.id],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_can_grant_user_roles(self):
        group = Group.objects.create(name="admin")
        group.permissions.set([Permission.objects.get(codename=permission._FORMS)])
        role = m.UserRole.objects.create(account=self.ghi, group=group)
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_roles": [role.id],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.jedi_council_corruscant.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid_with_existing_ones_outside(
        self,
    ):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id, self.jedi_squad_1])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.jedi_council_corruscant.id}, {"id": self.jedi_squad_1.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_cannot_assign_org_unit_outside_of_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.jedi_squad_1.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_update_profile_of_user_not_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_can_update_profile_if_not_themselves_in_sub_org_unit(self):
        self.jum.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_cannot_create_users(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        response = self.client.post(f"/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_delete_users(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        response = self.client.delete(f"/api/profiles/{jum.id}/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_update_from_unmanaged_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.jedi_council_corruscant_child.id])
        self.jum.iaso_profile.org_units.set([self.jedi_squad_1.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)
