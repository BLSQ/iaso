import typing

import jsonschema

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core import mail
from django.test import override_settings
from rest_framework import status

from iaso import models as m
from iaso.models import Profile
from iaso.models.microplanning import Team
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.test import APITestCase


name_and_id_schema = {
    "type": "object",
    "properties": {"id": {"type": "number"}, "name": {"type": "string"}},
    "required": ["name", "id"],
}

PROFILE_LOG_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "number"},
        "content-type": {"type": "string"},
        "object_id": {"type": "string"},
        "source": {"type": "string"},
        "created_at": {"type": "string"},
        "user": {
            "type": "object",
            "properties": {
                "id": {"type": "number"},
                "first_name": {"type": ["string", "null"]},
                "last_name": {"type": ["string", "null"]},
                "user_name": {"type": "string"},
                "email": {"type": ["string", "null"]},
                "language": {"type": ["string", "null"]},
                "phone_number": {"type": ["string", "null"]},
                "country_code": {"type": ["string", "null"]},
            },
            "required": ["id", "user_name"],
        },
        "past_value": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "pk": {"type": "number"},
                    "fields": {
                        "type": "object",
                        "properties": {
                            "user": {"type": "number"},
                            "first_name": {"type": ["string", "null"]},
                            "last_name": {"type": ["string", "null"]},
                            "username": {"type": ["string", "null"]},
                            "email": {"type": ["string", "null"]},
                            "organization": {"type": ["string", "null"]},
                            "user_permissions": {"type": "array", "items": {"type": "string"}},
                            "deleted_at": {"type": ["string", "null"]},
                            "account": {"type": "number"},
                            "dhis2_id": {"type": ["string", "null"]},
                            "language": {"type": ["string", "null"]},
                            "home_page": {"type": ["string", "null"]},
                            "projects": {"type": "array", "items": {"type": "number"}},
                            "org_units": {"type": "array", "items": {"type": "number"}},
                            "user_roles": {"type": "array", "items": {"type": "number"}},
                            "phone_number": {"type": ["string", "null"]},
                            "deleted_at": {"type": ["string", "null"]},
                        },
                        "required": ["user", "account"],
                    },
                },
            },
        },
        "new_value": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "pk": {"type": "number"},
                    "fields": {
                        "type": "object",
                        "properties": {
                            "user": {"type": "number"},
                            "first_name": {"type": ["string", "null"]},
                            "last_name": {"type": ["string", "null"]},
                            "username": {"type": ["string", "null"]},
                            "email": {"type": ["string", "null"]},
                            "organization": {"type": ["string", "null"]},
                            "user_permissions": {"type": "array", "items": {"type": "string"}},
                            "password_updated": {"type": "boolean"},
                            "deleted_at": {"type": ["string", "null"]},
                            "account": {"type": "number"},
                            "dhis2_id": {"type": ["string", "null"]},
                            "language": {"type": ["string", "null"]},
                            "home_page": {"type": ["string", "null"]},
                            "projects": {"type": "array", "items": {"type": "number"}},
                            "org_units": {"type": "array", "items": {"type": "number"}},
                            "user_roles": {"type": "array", "items": {"type": "number"}},
                            "phone_number": {"type": ["string", "null"]},
                            "deleted_at": {"type": ["string", "null"]},
                        },
                        "required": ["user"],
                    },
                },
            },
        },
    },
    "required": ["id", "user", "content_type", "source", "object_id", "created_at", "past_value", "new_value"],
}


class ProfileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.MODULES = [module.codename for module in MODULES]
        cls.account = m.Account.objects.create(name="Global Health Initiative", modules=cls.MODULES)
        cls.another_account = m.Account.objects.create(name="Another account")

        # TODO : make the org unit creations shorter and reusable
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=cls.account,
        )
        datasource = m.DataSource.objects.create(name="Evil Empire")
        datasource.projects.add(cls.project)
        cls.datasource = datasource
        cls.sub_unit_type = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.parent_org_unit_type = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.parent_org_unit_type.sub_unit_types.add(cls.sub_unit_type)

        cls.mock_multipolygon = None
        cls.mock_point = None

        cls.org_unit_group = m.Group.objects.create(name="Elite councils")
        cls.datasource = datasource
        source_version_1 = m.SourceVersion.objects.create(data_source=datasource, number=1)
        cls.account.default_version = source_version_1
        cls.account.save()
        cls.org_unit_from_sub_type = m.OrgUnit.objects.create(
            org_unit_type=cls.sub_unit_type,
            version=source_version_1,
            name="Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref=None,
        )

        cls.org_unit_from_parent_type = m.OrgUnit.objects.create(
            org_unit_type=cls.parent_org_unit_type,
            version=source_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="FooBarB4z00",
        )
        cls.org_unit_from_parent_type.groups.set([cls.org_unit_group])

        cls.child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.parent_org_unit_type,
            version=source_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            parent=cls.org_unit_from_parent_type,
        )

        cls.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )
        cls.group = Group.objects.create(name="user role")
        cls.group.permissions.add(cls.permission)
        cls.user_role = m.UserRole.objects.create(group=cls.group, account=cls.account)

        cls.group_another_account = Group.objects.create(name="user role with another account")
        cls.group_another_account.permissions.add(cls.permission)
        cls.user_role_another_account = m.UserRole.objects.create(
            group=cls.group_another_account, account=cls.another_account
        )

        # Users.
        cls.jane = cls.create_user_with_profile(
            username="janedoe", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.john = cls.create_user_with_profile(username="johndoe", account=cls.account, is_superuser=True)
        cls.jim = cls.create_user_with_profile(
            username="jim", account=cls.account, permissions=[CORE_FORMS_PERMISSION, CORE_USERS_ADMIN_PERMISSION]
        )
        cls.jam = cls.create_user_with_profile(
            username="jam",
            account=cls.account,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            language="en",
        )
        cls.jom = cls.create_user_with_profile(username="jom", account=cls.account, permissions=[], language="fr")
        cls.jum = cls.create_user_with_profile(
            username="jum", account=cls.account, permissions=[], projects=[cls.project]
        )
        cls.user_managed_geo_limit = cls.create_user_with_profile(
            username="managedGeoLimit",
            account=cls.account,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            org_units=[cls.org_unit_from_parent_type],
        )
        cls.team1 = Team.objects.create(project=cls.project, name="team1", manager=cls.jane)
        cls.team1.users.add(cls.jane)
        cls.team2 = Team.objects.create(project=cls.project, name="team2", manager=cls.jim)
        cls.team2.users.add(cls.jim)
        cls.user_managed_geo_limit.iaso_profile.user_roles.set([cls.user_role, cls.user_role_another_account])

        cls.user_role_name = cls.user_role.group.name.removeprefix(
            f"{cls.user_managed_geo_limit.iaso_profile.account.pk}_"
        )
        cls.user_role_another_account_name = cls.user_role_another_account.group.name.removeprefix(
            f"{cls.user_managed_geo_limit.iaso_profile.account.pk}_"
        )

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

        response = self.client.patch(f"/api/profiles/{jim.id}/", data=data, format="json")

        self.assertEqual(response.status_code, 200, response)

    def test_profile_me_without_auth(self):
        """GET /profiles/me/ without auth should result in a 401"""

        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 401)

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

    def test_profile_me_no_profile(self):
        """GET /profiles/me/ with auth, but without profile
        The goal is to know that this call doesn't result in a 500 error
        """
        User = get_user_model()
        username = "I don't have a profile, i'm sad :("
        user_without_profile = User.objects.create(username=username)
        self.client.force_authenticate(user_without_profile)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        self.assertEqual(response_data["user_name"], username)
        self.assertEqual(response_data["first_name"], "")
        self.assertEqual(response_data["last_name"], "")
        self.assertEqual(response_data["user_id"], user_without_profile.id)
        self.assertEqual(response_data["email"], "")
        self.assertEqual(response_data["projects"], [])
        self.assertFalse(response_data["is_staff"])
        self.assertFalse(response_data["is_superuser"])
        self.assertIsNone(response_data["account"])

    def test_profile_me_superuser_ok(self):
        """GET /profiles/me/ with auth (superuser)"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "johndoe")

    def test_profile_list_no_auth(self):
        """GET /profiles/ without auth -> 401"""

        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 401)

    def test_profile_list_read_only_permissions(self):
        """GET /profiles/ with auth (user has read only permissions)"""

        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(12):
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
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_export_as_csv(self):
        self.john.iaso_profile.org_units.set([self.org_unit_from_sub_type, self.org_unit_from_parent_type])
        self.jum.iaso_profile.editable_org_unit_types.set([self.sub_unit_type])

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
            "organization,"
            "permissions,"
            "user_roles,"
            "projects,"
            "phone_number,"
            "editable_org_unit_types\r\n"
        )

        expected_csv += "janedoe,,,,,,,,,,iaso_forms,,,,\r\n"
        expected_csv += f'johndoe,,,,,"{self.org_unit_from_sub_type.pk},{self.org_unit_from_parent_type.pk}",{self.org_unit_from_parent_type.source_ref},,,,,,,,\r\n'
        expected_csv += f'jim,,,,,,,,,,"{CORE_FORMS_PERMISSION.name},{CORE_USERS_ADMIN_PERMISSION.name}",,,,\r\n'
        expected_csv += f"jam,,,,,,,en,,,{CORE_USERS_MANAGED_PERMISSION.name},,,,\r\n"
        expected_csv += "jom,,,,,,,fr,,,,,,,\r\n"
        expected_csv += f"jum,,,,,,,,,,,,{self.project.name},,{self.sub_unit_type.pk}\r\n"
        expected_csv += f'managedGeoLimit,,,,,{self.org_unit_from_parent_type.id},{self.org_unit_from_parent_type.source_ref},,,,{CORE_USERS_MANAGED_PERMISSION.name},"{self.user_role_name},{self.user_role_another_account_name}",,,\r\n'

        self.assertEqual(response_csv, expected_csv)

    def test_profile_list_export_as_xlsx(self):
        self.john.iaso_profile.org_units.set([self.org_unit_from_sub_type, self.org_unit_from_parent_type])
        self.jum.iaso_profile.editable_org_unit_types.set([self.sub_unit_type])

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/?xlsx=true")
        excel_columns, excel_data = self.assertXlsxFileResponse(response)

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
                "organization",
                "permissions",
                "user_roles",
                "projects",
                "phone_number",
                "editable_org_unit_types",
            ],
        )

        self.assertDictEqual(
            excel_data,
            {
                "username": {0: "janedoe", 1: "johndoe", 2: "jim", 3: "jam", 4: "jom", 5: "jum", 6: "managedGeoLimit"},
                "password": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "email": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "first_name": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "last_name": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "orgunit": {
                    0: None,
                    1: f"{self.org_unit_from_sub_type.id},{self.org_unit_from_parent_type.id}",
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: f"{self.org_unit_from_parent_type.id}",
                },
                "orgunit__source_ref": {
                    0: None,
                    1: self.org_unit_from_parent_type.source_ref,
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: self.org_unit_from_parent_type.source_ref,
                },
                "profile_language": {0: None, 1: None, 2: None, 3: "en", 4: "fr", 5: None, 6: None},
                "dhis2_id": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "organization": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "permissions": {
                    0: CORE_FORMS_PERMISSION.name,
                    1: None,
                    2: f"{CORE_FORMS_PERMISSION.name},{CORE_USERS_ADMIN_PERMISSION.name}",
                    3: CORE_USERS_MANAGED_PERMISSION.name,
                    4: None,
                    5: None,
                    6: CORE_USERS_MANAGED_PERMISSION.name,
                },
                "user_roles": {
                    0: None,
                    1: None,
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: f"{self.user_role_name},{self.user_role_another_account_name}",
                },
                "projects": {0: None, 1: None, 2: None, 3: None, 4: None, 5: self.project.name, 6: None},
                "phone_number": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "editable_org_unit_types": {
                    0: None,
                    1: None,
                    2: None,
                    3: None,
                    4: None,
                    5: self.sub_unit_type.pk,
                    6: None,
                },
            },
        )

    def test_profile_list_user_admin_ok(self):
        """GET /profiles/ with auth (user has user admin permissions)"""
        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_superuser_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_user_manager_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_managed_user_only_superuser(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_managed_user_only_user_admin(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 7)

    def test_profile_list_managed_user_only_user_manager_no_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 6)

    def test_profile_list_managed_user_only_user_manager_with_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        response = self.client.get("/api/profiles/?managedUsersOnly=true")
        self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response.json(), 2)

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

    def test_create_user_with_user_roles_and_permissions(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "user_permissions": [CORE_FORMS_PERMISSION.name],
            "user_roles": [self.user_role.id],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        user_user_role = m.UserRole.objects.get(pk=response_data["user_roles"][0])
        self.assertValidProfileData(response_data)
        self.assertEqual(user_user_role.id, self.user_role.id)
        self.assertEqual(user_user_role.group.name, self.group.name)

        user = m.User.objects.get(username="unittest_user_name")
        self.assertEqual(user.user_permissions.count(), 1)
        self.assertEqual(user.user_permissions.first().codename, "iaso_forms")

    def test_create_user_with_not_allowed_user_roles(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "user_permissions": [CORE_FORMS_PERMISSION.name],
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
        self.assertQuerySetEqual(user.user_permissions.all(), [])
        self.assertEqual(m.User.objects.filter(username=data["user_name"]).count(), 1)
        # check that we have copied the account from the creator account
        self.assertEqual(profile.account, self.account)

        profile_id = profile.id
        user_id = user.id
        response = self.client.delete(f"/api/profiles/{profile_id}/")

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(m.User.objects.filter(id=user_id), [])
        self.assertQuerySetEqual(m.Profile.objects.filter(id=profile_id), [])

    def test_create_profile_with_org_units_and_perms(self):
        self.client.force_authenticate(self.jim)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "org_units": [{"id": self.org_unit_from_parent_type.id}],
            "user_permissions": [CORE_FORMS_PERMISSION.name],
            "editable_org_unit_type_ids": [self.sub_unit_type.id],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertValidProfileData(response_data)
        self.assertEqual(response_data["user_name"], "unittest_user_name")
        self.assertEqual(response_data["is_superuser"], False)

        profile = m.Profile.objects.get(pk=response_data["id"])
        self.assertEqual(profile.editable_org_unit_types.count(), 1)
        self.assertEqual(profile.editable_org_unit_types.first(), self.sub_unit_type)

        user = profile.user
        self.assertEqual(user.username, data["user_name"])
        self.assertEqual(user.first_name, data["first_name"])

        self.assertEqual(m.User.objects.filter(username=data["user_name"]).count(), 1)
        self.assertEqual(profile.account, self.account)

        self.assertQuerySetEqual(
            user.user_permissions.all(),
            ["<Permission: iaso | core permission support | Formulaires>"],
            transform=repr,
        )
        org_units = profile.org_units.all()
        self.assertEqual(org_units.count(), 1)
        self.assertEqual(org_units[0].name, "Corruscant Jedi Council")

    @override_settings(DEFAULT_FROM_EMAIL="sender@test.com", DNS_DOMAIN="iaso-test.bluesquare.org")
    def test_create_profile_with_send_email(self):
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

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.subject, "Set up a password for your new account on iaso-test.bluesquare.org")
        self.assertEqual(email.from_email, "sender@test.com")
        self.assertEqual(email.to, ["test@test.com"])
        self.assertIn("http://iaso-test.bluesquare.org", email.body)
        self.assertIn("The iaso-test.bluesquare.org Team.", email.body)

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

    def test_create_profile_with_managed_geo_limit(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "org_units": [{"id": self.child_org_unit.id}],
            "user_permissions": [CORE_FORMS_PERMISSION.name],
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
        self.assertEqual(profile.account, self.account)

        self.assertQuerySetEqual(
            user.user_permissions.all(),
            ["<Permission: iaso | core permission support | Formulaires>"],
            transform=repr,
        )
        org_units = profile.org_units.all()
        self.assertEqual(org_units.count(), 1)
        self.assertEqual(org_units[0].name, "Corruscant Jedi Council")

    def test_create_profile_without_org_unit_with_managed_geo_limit(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "unittest_last_name",
            "user_permissions": [CORE_FORMS_PERMISSION.name],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")

        self.assertEqual(response.status_code, 403)

    def test_create_user_is_atomic(self):
        project_1 = m.Project.objects.create(name="Project 1", app_id="project.1", account=self.account)
        project_2 = m.Project.objects.create(name="Project 2", app_id="project.2", account=self.account)

        username = "john_doe"

        user = self.user_managed_geo_limit
        user.iaso_profile.projects.set([project_1])

        self.client.force_authenticate(user)

        self.assertEqual(get_user_model().objects.filter(username=username).count(), 0)

        data = {
            "user_name": username,
            "password": "password",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@doe.com",
            "projects": [project_2.id],
            "org_units": [{"id": self.org_unit_from_parent_type.id}],
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            "Some projects are outside your scope.",
        )

        # If the creation is not successfully completed, no changes should be committed to the database.
        self.assertEqual(get_user_model().objects.filter(username=username).count(), 0)

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
        self.assertEqual(response_data["account"]["feature_flags"], [])

        # add a feature flags
        self.account.feature_flags.add(aff)

        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], ["shape"])

        # remove feature flags
        self.account.feature_flags.remove(aff)
        response = self.client.get("/api/profiles/me/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], [])

    def test_search_user_by_permissions(self):
        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/profiles/?permissions=iaso_users")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "jim")
        self.assertEqual(len(response.json()["profiles"]), 1)

    def test_search_user_by_org_units(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(f"/api/profiles/?location={self.org_unit_from_parent_type.pk}&limit=100")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 2)

    def test_search_user_by_org_units_type(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(f"/api/profiles/?orgUnitTypes={self.parent_org_unit_type.pk}&limit=100")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 2)

    def test_search_user_by_children_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.child_org_unit])

        response = self.client.get(
            f"/api/profiles/?location={self.org_unit_from_parent_type.pk}&ouParent=false&ouChildren=true"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 2)

    def test_search_user_by_parent_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(
            f"/api/profiles/?location={self.child_org_unit.pk}&ouParent=true&ouChildren=false&limit=100"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(len(response.json()["profiles"]), 2)

    def test_search_by_ids(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/", {"ids": f"{self.jane.id},{self.jim.id}"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["profiles"]), 2)
        self.assertEqual(response.json()["profiles"][0]["user_name"], "janedoe")
        self.assertEqual(response.json()["profiles"][1]["user_name"], "jim")

    def test_search_by_teams(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/profiles/", {"teams": f"{self.team1.pk},{self.team2.pk}"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["profiles"]), 2)
        user_names = [item["user_name"] for item in response.data["profiles"]]
        self.assertIn("janedoe", user_names)
        self.assertIn("jim", user_names)

    def test_user_with_managed_permission_can_update_profile_of_user_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "user_permissions": [CORE_FORMS_PERMISSION.name, CORE_USERS_MANAGED_PERMISSION.name],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_without_location_can_update_profile_of_user_in_whole_pyramid(self):
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "org_units": [{"id": self.org_unit_from_parent_type.id}],
            "user_permissions": [CORE_FORMS_PERMISSION.name, CORE_USERS_MANAGED_PERMISSION.name],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        jum.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(jum.org_units.values_list("id", flat=True)), [self.org_unit_from_parent_type.id])

    def test_user_with_managed_permission_cannot_grant_user_admin_permission(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_permissions": [
                CORE_FORMS_PERMISSION.name,
                CORE_USERS_MANAGED_PERMISSION.name,
                CORE_USERS_ADMIN_PERMISSION.name,
            ],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_grant_user_admin_permission_through_user_roles(self):
        group = Group.objects.create(name="admin")
        group.permissions.set([Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.name)])
        role = m.UserRole.objects.create(account=self.account, group=group)
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
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
        group.permissions.set([Permission.objects.get(codename=CORE_FORMS_PERMISSION.name)])
        role = m.UserRole.objects.create(account=self.account, group=group)
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_roles": [role.id],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.org_unit_from_parent_type.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid_with_existing_ones_outside(
        self,
    ):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id, self.org_unit_from_sub_type])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.org_unit_from_parent_type.id}, {"id": self.org_unit_from_sub_type.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

    def test_user_with_managed_permission_cannot_assign_org_unit_outside_of_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [{"id": self.org_unit_from_sub_type.id}],
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_update_profile_of_user_not_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
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
        self.jum.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
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

    def test_update_user_should_fail_when_assigning_an_org_unit_outside_of_the_author_own_health_pyramid(self):
        user = self.jam
        user.iaso_profile.org_units.set([self.org_unit_from_sub_type])

        self.assertTrue(user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertFalse(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        profile_to_modify = Profile.objects.get(user=self.jum)
        profile_to_modify.org_units.set([self.org_unit_from_sub_type])

        self.client.force_authenticate(user)
        data = {
            "user_name": "new_user_name",
            "org_units": [
                {"id": self.org_unit_from_parent_type.pk},
                {"id": "foo"},
                {"bar": "foo"},
            ],
        }
        response = self.client.patch(f"/api/profiles/{profile_to_modify.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            (
                f"User with {CORE_USERS_MANAGED_PERMISSION} cannot assign an OrgUnit outside "
                f"of their own health pyramid. Trying to assign {self.org_unit_from_parent_type.pk}."
            ),
        )

    def test_update_user_should_succeed_with_restricted_editable_org_unit_types_when_modifying_another_field(self):
        """
        A user restricted to a given OrgUnitType should be able to edit another user as long as
        he's not modifying the `org_units` or `editable_org_unit_type_ids` fields.
        """
        user = self.jam

        self.assertTrue(user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertFalse(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        user.iaso_profile.org_units.set([self.org_unit_from_parent_type])
        user.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type is now writable.
            [self.sub_unit_type]
        )

        jum_profile = Profile.objects.get(user=self.jum)
        jum_profile.org_units.set([self.org_unit_from_parent_type])
        jum_profile.editable_org_unit_types.set(
            # Only org units of this type is now writable.
            [self.parent_org_unit_type]
        )

        self.client.force_authenticate(user)

        data = {
            "user_name": "new_user_name",
            "org_units": [{"id": self.org_unit_from_parent_type.id}],
            "editable_org_unit_type_ids": [self.parent_org_unit_type.id],
        }
        response = self.client.patch(f"/api/profiles/{jum_profile.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        self.jum.refresh_from_db()
        self.assertEqual(self.jum.username, "new_user_name")

    def test_user_with_managed_permission_cannot_create_users(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        response = self.client.post("/api/profiles/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_delete_users(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        response = self.client.delete(f"/api/profiles/{jum.id}/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_managed_permission_cannot_update_from_unmanaged_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.child_org_unit.id])
        self.jum.iaso_profile.org_units.set([self.org_unit_from_sub_type.id])
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

    def test_update_user_add_phone_number(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.john)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "phone_number": "32477123456",
            "country_code": "be",
        }
        response = self.client.patch(f"/api/profiles/{jum.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        updated_jum = Profile.objects.get(user=self.jum)
        self.assertEqual(updated_jum.phone_number.as_e164, "+32477123456")

    def test_update_user_with_malformed_phone_number(self):
        user = self.jam
        profile_to_edit = Profile.objects.get(user=self.jum)

        self.client.force_authenticate(user)

        data = {
            "user_name": "new_name",
            "phone_number": "not_a_phone_number",
            "country_code": "",
        }
        response = self.client.patch(f"/api/profiles/{profile_to_edit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["phone_number"], "Both phone number and country code must be provided")

        data = {
            "user_name": "new_name",
            "phone_number": "not_a_phone_number",
            "country_code": "US",
        }
        response = self.client.patch(f"/api/profiles/{profile_to_edit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["phone_number"], "Invalid phone number format")

        data = {
            "user_name": "new_name",
            "phone_number": "03666666",
            "country_code": "FR",
        }
        response = self.client.patch(f"/api/profiles/{profile_to_edit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["phone_number"], "Invalid phone number")

        data = {
            "user_name": "new_name",
            "phone_number": "0387762121",
            "country_code": "FR",
        }
        response = self.client.patch(f"/api/profiles/{profile_to_edit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["phone_number"], "+33387762121")

        data = {
            "user_name": "new_name",
            "phone_number": "",
            "country_code": "",
        }
        response = self.client.patch(f"/api/profiles/{profile_to_edit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["phone_number"], None)

    def test_update_user_with_projects_restrictions(self):
        new_project_1 = m.Project.objects.create(name="New project 1", app_id="new.project.1", account=self.account)
        new_project_2 = m.Project.objects.create(name="New project 2", app_id="new.project.2", account=self.account)
        profile_to_edit = Profile.objects.get(user=self.jum)
        profile_to_edit.projects.clear()
        user = self.jam
        self.client.force_authenticate(user)
        self.assertEqual(user.iaso_profile.projects.count(), 0)
        self.assertEqual(profile_to_edit.projects.count(), 0)

        # A user without `projects` restrictions can set any project.
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), self.project)
        self.assertEqual(profile_to_edit.user.username, "jum_new_user_name")

        # A user with `projects` restrictions can edit a user with the same `projects` restrictions.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project, new_project_1, new_project_2])
        profile_to_edit.projects.set([self.project, new_project_1, new_project_2])
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id, new_project_1.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 2)

        # A user with `projects` restrictions cannot edit a user who has broader access to projects.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project])
        profile_to_edit.projects.set([self.project, new_project_1, new_project_2])
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            "You cannot edit a user who has broader access to projects.",
        )

        # A user with `projects` restrictions can edit a user who has narrower access to projects.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project, new_project_1])
        profile_to_edit.projects.set([self.project])
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_1.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), new_project_1)
        self.assertEqual(profile_to_edit.user.username, "jum_new_user_name")

        # A user with `projects` restrictions cannot create a user without restrictions.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project])
        self.assertEqual(user.iaso_profile.projects.count(), 1)
        profile_to_edit.projects.clear()
        self.assertEqual(profile_to_edit.projects.count(), 0)
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={"user_name": "jum_new_user_name", "projects": []},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            "You must specify which projects are authorized for this user.",
        )

        # A user with `projects` restrictions cannot assign projects outside his range.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project])
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            "Some projects are outside your scope.",
        )

        # An "admin" user with `projects` restrictions can assign projects outside his range.
        user.user_permissions.add(Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.name))
        del user._perm_cache
        del user._user_perm_cache
        self.assertTrue(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))
        user.iaso_profile.projects.set([self.project])
        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_admin_should_be_able_to_bypass_projects_restrictions_for_himself(self):
        """
        An admin with `projects` restrictions should be able to assign himself to any project.
        """
        project_1 = m.Project.objects.create(name="Project 1", app_id="project.1", account=self.account)
        project_2 = m.Project.objects.create(name="Project 2", app_id="project.2", account=self.account)

        user_admin = self.jim
        self.assertFalse(user_admin.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertTrue(user_admin.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        profile_to_edit = user_admin.iaso_profile
        profile_to_edit.projects.set([project_1])
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), project_1)

        self.client.force_authenticate(user_admin)

        response = self.client.patch(
            f"/api/profiles/{profile_to_edit.id}/",
            data={
                "user_name": user_admin.username,
                "projects": [project_2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), project_2)

    def get_new_user_data(self):
        user_name = "audit_user"
        pwd = "admin1234lol"
        first_name = "audit_user_first_name"
        last_name = "audit_user_last_name"
        email = "audit@test.com"
        organization = "Bluesquare"
        org_units = [
            {
                "id": f"{self.org_unit_from_parent_type.id}",
                "name": self.org_unit_from_parent_type.name,
                "validation_status": self.org_unit_from_parent_type.validation_status,
                "has_children": False,
                "org_unit_type_id": self.parent_org_unit_type.id,
                "org_unit_type_short_name": "Cnc",
            }
        ]
        language = "fr"
        home_page = "/forms/list"
        dhis2_id = "666666666666"
        user_roles = [self.user_role.id]
        user_roles_permissions = [
            {
                "id": self.user_role.id,
                "name": self.user_role.group.name,
                "permissions": [self.permission.name],
                "created_at": self.user_role.created_at,
                "updated_at": self.user_role.updated_at,
            }
        ]
        user_permissions = [CORE_ORG_UNITS_READ_PERMISSION.name]
        send_email_invitation = False
        projects = [self.project.id]
        phone_number = "32475888888"
        country_code = "be"
        data = {
            "user_name": user_name,
            "password": pwd,
            "first_name": first_name,
            "last_name": last_name,
            "send_email_invitation": send_email_invitation,
            "email": email,
            "organization": organization,
            "language": language,
            "home_page": home_page,
            "dhis2_id": dhis2_id,
            "permissions": [],  # This looks legacy from an older version of the API
            "user_permissions": user_permissions,
            "projects": projects,
            "phone_number": phone_number,
            "country_code": country_code,
            "user_roles": user_roles,
            "user_roles_permissions": user_roles_permissions,
            "org_units": org_units,
        }
        return data

    def test_log_on_user_create(self):
        self.client.force_authenticate(self.john)

        data = self.get_new_user_data()
        response = self.client.post("/api/profiles/", data=data, format="json")
        response_data = self.assertJSONResponse(response, 200)
        new_profile_id = response_data["id"]
        new_user_id = response_data["user_id"]

        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={new_profile_id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(log["past_value"], [])
        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_profile = log["new_value"][0]["fields"]
        self.assertEqual(new_profile["user"], new_user_id)
        self.assertEqual(new_profile["username"], data["user_name"])
        self.assertEqual(new_profile["first_name"], data["first_name"])
        self.assertEqual(new_profile["last_name"], data["last_name"])
        self.assertEqual(new_profile["email"], data["email"])
        self.assertEqual(new_profile["organization"], data["organization"])
        self.assertEqual(len(new_profile["user_permissions"]), 1)
        self.assertEqual(new_profile["user_permissions"], data["user_permissions"])
        self.assertTrue(new_profile["password_updated"])
        self.assertNotIn("password", new_profile.keys())

        self.assertEqual(new_profile["dhis2_id"], data["dhis2_id"])
        self.assertEqual(new_profile["language"], data["language"])
        self.assertEqual(new_profile["home_page"], data["home_page"])
        self.assertEqual(new_profile["phone_number"], f"+{data['phone_number']}")
        self.assertEqual(len(new_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, new_profile["org_units"])
        self.assertEqual(len(new_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_profile["user_roles"])
        self.assertEqual(len(new_profile["projects"]), 1)
        self.assertIn(self.project.id, new_profile["projects"])

    def test_log_on_user_delete(self):
        self.client.force_authenticate(self.john)
        data = self.get_new_user_data()
        response = self.client.post("/api/profiles/", data=data, format="json")
        response_data = self.assertJSONResponse(response, 200)
        new_profile_id = response_data["id"]
        new_user_id = response_data["user_id"]

        response = self.client.delete(f"/api/profiles/{new_profile_id}/")
        self.assertJSONResponse(response, 200)

        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={new_profile_id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_profile = log["new_value"][0]["fields"]
        self.assertEqual(new_profile["user"], new_user_id)
        self.assertEqual(new_profile["username"], data["user_name"])
        self.assertEqual(new_profile["first_name"], data["first_name"])
        self.assertEqual(new_profile["last_name"], data["last_name"])
        self.assertEqual(new_profile["email"], data["email"])
        self.assertEqual(len(new_profile["user_permissions"]), 1)
        self.assertEqual(new_profile["user_permissions"], data["user_permissions"])
        self.assertIsNotNone(new_profile["deleted_at"])
        self.assertFalse(new_profile["password_updated"])
        self.assertNotIn("password", new_profile.keys())

        self.assertEqual(new_profile["dhis2_id"], data["dhis2_id"])
        self.assertEqual(new_profile["language"], data["language"])
        self.assertEqual(new_profile["home_page"], data["home_page"])
        self.assertEqual(new_profile["phone_number"], f"+{data['phone_number']}")
        self.assertEqual(len(new_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, new_profile["org_units"])
        self.assertEqual(len(new_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_profile["user_roles"])
        self.assertEqual(len(new_profile["projects"]), 1)
        self.assertIn(self.project.id, new_profile["projects"])
        self.assertIsNotNone(new_profile["deleted_at"])

        self.assertEqual(log["past_value"][0]["pk"], new_profile_id)
        past_profile = log["past_value"][0]["fields"]
        self.assertEqual(past_profile["user"], new_user_id)
        self.assertEqual(past_profile["username"], data["user_name"])
        self.assertEqual(past_profile["first_name"], data["first_name"])
        self.assertEqual(past_profile["last_name"], data["last_name"])
        self.assertEqual(past_profile["email"], data["email"])
        self.assertEqual(len(past_profile["user_permissions"]), 1)
        self.assertEqual(past_profile["user_permissions"], data["user_permissions"])
        self.assertIsNone(past_profile["deleted_at"])
        self.assertNotIn("password", past_profile.keys())

        self.assertEqual(past_profile["dhis2_id"], data["dhis2_id"])
        self.assertEqual(past_profile["language"], data["language"])
        self.assertEqual(past_profile["home_page"], data["home_page"])
        self.assertEqual(past_profile["phone_number"], f"+{data['phone_number']}")
        self.assertEqual(len(past_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, past_profile["org_units"])
        self.assertEqual(len(past_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, past_profile["user_roles"])
        self.assertEqual(len(past_profile["projects"]), 1)
        self.assertIn(self.project.id, past_profile["projects"])
        self.assertIsNone(past_profile["deleted_at"])

    def test_log_on_user_update(self):
        self.client.force_authenticate(self.john)
        data = self.get_new_user_data()
        response = self.client.post("/api/profiles/", data=data, format="json")
        response_data = self.assertJSONResponse(response, 200)
        new_profile_id = response_data["id"]
        new_user_id = response_data["user_id"]
        new_user_name = response_data["user_name"]

        new_data = {
            "id": new_profile_id,
            "user_name": new_user_name,
            "org_units": [
                {
                    "id": f"{self.org_unit_from_parent_type.id}",
                    "name": self.org_unit_from_parent_type.name,
                    "validation_status": self.org_unit_from_parent_type.validation_status,
                    "has_children": False,
                    "org_unit_type_id": self.parent_org_unit_type.id,
                    "org_unit_type_short_name": "Cnc",
                },
                {
                    "id": f"{self.org_unit_from_sub_type.id}",
                    "name": self.org_unit_from_sub_type.name,
                    "validation_status": self.org_unit_from_sub_type.validation_status,
                    "has_children": False,
                    "org_unit_type_id": self.sub_unit_type.id,
                    "org_unit_type_short_name": "Jds",
                },
            ],
            "language": "en",
            "password": "yolo",
            "home_page": "/orgunits/list",
            "organization": "Bluesquare",
            "user_permissions": [CORE_ORG_UNITS_READ_PERMISSION.name, CORE_FORMS_PERMISSION.name],
            "user_roles": [],
            "user_roles_permissions": [],
        }

        response = self.client.patch(f"/api/profiles/{new_profile_id}/", data=new_data, format="json")
        self.assertJSONResponse(response, 200)

        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={new_profile_id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))
        self.assertEqual(log["past_value"][0]["pk"], new_profile_id)
        past_value = log["past_value"][0]["fields"]
        self.assertEqual(past_value["user"], new_user_id)
        self.assertEqual(past_value["username"], data["user_name"])
        self.assertEqual(past_value["first_name"], data["first_name"])
        self.assertEqual(past_value["last_name"], data["last_name"])
        self.assertEqual(past_value["email"], data["email"])
        self.assertEqual(len(past_value["user_permissions"]), 1)
        self.assertEqual(past_value["user_permissions"], data["user_permissions"])
        self.assertNotIn("password", past_value.keys())

        self.assertEqual(past_value["dhis2_id"], data["dhis2_id"])
        self.assertEqual(past_value["language"], data["language"])
        self.assertEqual(past_value["home_page"], data["home_page"])
        self.assertEqual(past_value["phone_number"], f"+{data['phone_number']}")
        self.assertEqual(len(past_value["org_units"]), 1)
        self.assertIn(
            self.org_unit_from_parent_type.id,
            past_value["org_units"],
        )
        self.assertEqual(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, past_value["user_roles"])
        self.assertEqual(len(past_value["projects"]), 1)
        self.assertIn(self.project.id, past_value["projects"])
        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_value = log["new_value"][0]["fields"]
        self.assertTrue(new_value["password_updated"])
        self.assertNotIn("password", new_value.keys())
        self.assertEqual(len(new_value["user_permissions"]), 2)
        self.assertIn("iaso_forms", new_value["user_permissions"])
        self.assertIn("iaso_org_units_read", new_value["user_permissions"])
        self.assertEqual(new_value["language"], new_data["language"])
        self.assertEqual(new_value["home_page"], new_data["home_page"])
        self.assertEqual(new_value["organization"], new_data["organization"])
        self.assertEqual(len(new_value["org_units"]), 2)
        self.assertIn(self.org_unit_from_parent_type.id, new_value["org_units"])
        self.assertIn(self.org_unit_from_sub_type.id, new_value["org_units"])
        self.assertEqual(new_value["user_roles"], [])

    def test_log_on_user_updates_own_profile(self):
        self.client.force_authenticate(self.jim)
        new_data = {"language": "fr"}
        response = self.client.patch("/api/profiles/me/", data=new_data, format="json")
        self.assertJSONResponse(response, 200)
        # Log as super user to access the logs API
        self.client.force_authenticate(self.john)
        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={self.jim.iaso_profile.id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(log["past_value"][0]["pk"], self.jim.iaso_profile.id)
        past_value = log["past_value"][0]["fields"]
        self.assertEqual(past_value["user"], self.jim.id)
        self.assertEqual(past_value["username"], self.jim.username)
        self.assertEqual(past_value["first_name"], "")
        self.assertEqual(past_value["language"], None)
        self.assertNotIn("password", past_value.keys())

        self.assertEqual(log["new_value"][0]["pk"], self.jim.iaso_profile.id)
        new_value = log["new_value"][0]["fields"]
        self.assertEqual(new_value["user"], self.jim.id)
        self.assertEqual(new_value["username"], self.jim.username)
        self.assertEqual(new_value["first_name"], "")
        self.assertEqual(new_value["language"], "fr")
        self.assertNotIn("password", new_value.keys())

    def test_profile_list_search_by_children_ou_deep_hierarchy(self):
        """Test that searching by children org units returns profiles from all levels of the hierarchy"""
        # Create a deeper hierarchy
        child_of_child = m.OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Child of child org unit",
            parent=self.child_org_unit,
        )

        grand_child = m.OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Grand child org unit",
            parent=child_of_child,
        )

        # Clear existing org units first to avoid interference
        for profile in m.Profile.objects.all():
            profile.org_units.clear()

        # Assign users to different levels of the hierarchy
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])  # Root
        self.jim.iaso_profile.org_units.set([self.child_org_unit])  # Child
        self.jam.iaso_profile.org_units.set([child_of_child])  # Child of child
        self.jom.iaso_profile.org_units.set([grand_child])  # Grand child

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/profiles/?location={self.org_unit_from_parent_type.pk}&ouChildren=true")

        self.assertEqual(response.status_code, 200)
        profiles = response.json()["profiles"]
        usernames = [p["user_name"] for p in profiles]

        # Should include users from all levels
        self.assertEqual(len(profiles), 4)
        self.assertIn("janedoe", usernames)  # Root level
        self.assertIn("jim", usernames)  # Child level
        self.assertIn("jam", usernames)  # Child of child level
        self.assertIn("jom", usernames)  # Grand child level

    def test_profile_list_search_by_parent_and_children_ou(self):
        """Test that searching with both parent and children flags returns the complete hierarchy"""
        # Clear existing org units first
        for profile in m.Profile.objects.all():
            profile.org_units.clear()

        # Setup hierarchy
        parent_of_root = m.OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Parent of root",
        )
        self.org_unit_from_parent_type.parent = parent_of_root
        self.org_unit_from_parent_type.save()

        # Assign users to different levels
        self.jane.iaso_profile.org_units.set([parent_of_root])  # Parent
        self.jim.iaso_profile.org_units.set([self.org_unit_from_parent_type])  # Current
        self.jam.iaso_profile.org_units.set([self.child_org_unit])  # Child

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            f"/api/profiles/?location={self.org_unit_from_parent_type.pk}&ouParent=true&ouChildren=true"
        )

        self.assertEqual(response.status_code, 200)
        profiles = response.json()["profiles"]
        usernames = [p["user_name"] for p in profiles]

        # Should include users from parent, current and child levels
        self.assertEqual(len(profiles), 3)
        self.assertIn("janedoe", usernames)  # Parent level
        self.assertIn("jim", usernames)  # Current level
        self.assertIn("jam", usernames)  # Child level

    def test_profile_list_search_by_children_ou_no_duplicates(self):
        """Test that searching by children org units doesn't return duplicate profiles
        when a user is assigned to multiple levels"""
        # Clear existing org units first
        for profile in m.Profile.objects.all():
            profile.org_units.clear()

        # Assign a user to multiple levels in the hierarchy
        self.jane.iaso_profile.org_units.set(
            [
                self.org_unit_from_parent_type,  # Root
                self.child_org_unit,  # Child
            ]
        )

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/profiles/?location={self.org_unit_from_parent_type.pk}&ouChildren=true")

        self.assertEqual(response.status_code, 200)
        profiles = response.json()["profiles"]

        # Should only include the user once despite being in multiple levels
        self.assertEqual(len(profiles), 1)
        self.assertEqual(profiles[0]["user_name"], "janedoe")

    def test_profile_list_search_with_children_ou_preserves_search_results(self):
        """
        Test that search results are preserved with `ouChildren`.
        """
        # Clear existing org units first.
        for profile in m.Profile.objects.all():
            profile.org_units.clear()

        # This user matches "jim" search.
        self.jim.iaso_profile.org_units.set([self.child_org_unit])

        # Create a user that matches "jim" search but is NOT in the hierarchy.
        self.create_user_with_profile(
            username="jim_outside", account=self.account, permissions=[core_permissions._USERS_ADMIN]
        )

        self.client.force_authenticate(self.jim)

        # Search for "jim" without ouChildren - should return both `jim` and `jim_outside`.
        response = self.client.get("/api/profiles/?search=jim")
        self.assertEqual(response.status_code, 200)
        profiles = response.json()["profiles"]
        self.assertEqual(len(profiles), 2)

        # Search for "jim" with `ouChildren=true` - should only return jim (who is in hierarchy).
        response = self.client.get(
            f"/api/profiles/?search=jim&location={self.org_unit_from_parent_type.pk}&ouChildren=true"
        )
        self.assertEqual(response.status_code, 200)
        profiles = response.json()["profiles"]
        # Should only return `jim` (who is in the hierarchy) and NOT `jim_outside`.
        self.assertEqual(len(profiles), 1)
        self.assertEqual(profiles[0]["user_name"], "jim")

    def test_update_password_for_single_user(self):
        single_user = self.jim
        single_user.set_password("p4ssword")
        single_user.save()

        self.client.force_authenticate(single_user)
        new_data = {
            "user_name": single_user.username,
            "password": "new_p4ssword",
        }
        response = self.client.patch(f"/api/profiles/{single_user.iaso_profile.pk}/", data=new_data, format="json")
        self.assertJSONResponse(response, 200)
        single_user.refresh_from_db()
        self.assertEqual(single_user.check_password("new_p4ssword"), True)

    def test_update_password_for_multi_user(self):
        """
        For tenant users, changing the password of an `account_user`
        should update the password of the `main_user`.
        """
        main_user = m.User.objects.create(username="main_user", email="main_user@health.org")
        main_user.set_password("p4ssword")
        main_user.save()
        account_user = self.create_user_with_profile(
            username="user_1",
            email="user_1@health.org",
            account=self.account,
            permissions=[CORE_USERS_ADMIN_PERMISSION],
        )
        m.TenantUser.objects.create(main_user=main_user, account_user=account_user)

        self.client.force_authenticate(account_user)
        new_data = {
            "user_name": account_user.username,
            "password": "new_p4ssword",
        }
        response = self.client.patch(f"/api/profiles/{account_user.iaso_profile.pk}/", data=new_data, format="json")
        self.assertJSONResponse(response, 200)
        main_user.refresh_from_db()
        self.assertEqual(main_user.check_password("new_p4ssword"), True)

    def test_list_profiles_sorted_by_annotated_first_user_role(self):
        """
        Test that profiles are properly sorted by their alphabetically first user role.
        """
        data_manager_group = Group.objects.create(name=f"{self.account.pk}_Data manager")
        gpei_group = Group.objects.create(name=f"{self.account.pk}_GPEI coordinators")
        zulu_group = Group.objects.create(name=f"{self.account.pk}_Zulu role")

        data_manager_role = m.UserRole.objects.create(group=data_manager_group, account=self.account)
        gpei_role = m.UserRole.objects.create(group=gpei_group, account=self.account)
        zulu_role = m.UserRole.objects.create(group=zulu_group, account=self.account)

        # Clear the users.
        self.account.profile_set.exclude(user_id=self.john.pk).delete()

        # User 1: multiple roles starting with "Data manager" (should be first).
        user1 = self.create_user_with_profile(
            username="user_multi_data", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user1.iaso_profile.user_roles.set([data_manager_role, gpei_role])

        # User 2: single role "GPEI" (should be middle).
        user2 = self.create_user_with_profile(
            username="user_single_gpei", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user2.iaso_profile.user_roles.set([gpei_role])

        # User 3: single role "Zulu" (should be last)
        user3 = self.create_user_with_profile(
            username="user_single_zulu", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user3.iaso_profile.user_roles.set([zulu_role])

        # User 4: multiple roles starting with "GPEI coordinators" (should be between user1 and user3)
        user4 = self.create_user_with_profile(
            username="user_multi_gpei", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user4.iaso_profile.user_roles.set([gpei_role, zulu_role])

        self.client.force_authenticate(self.john)

        # Test ascending order.

        response = self.client.get("/api/profiles/?order=annotated_first_user_role&limit=10")
        self.assertJSONResponse(response, 200)

        actual_order = []
        for profile in response.json()["profiles"]:
            if not profile["user_roles"]:
                actual_order.append(None)
                continue
            role_id = profile["user_roles"][0]
            group_name = m.UserRole.objects.get(id=role_id).group.name
            actual_order.append(group_name)

        expected_order = [
            f"{self.account.pk}_Data manager",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_Zulu role",
            None,
        ]

        self.assertEqual(
            actual_order,
            expected_order,
            f"Users not sorted correctly by first role. Expected: {expected_order}, got: {actual_order}",
        )

        # Test descending order.

        response = self.client.get("/api/profiles/?order=-annotated_first_user_role&limit=10")
        self.assertJSONResponse(response, 200)

        actual_order = []
        for profile in response.json()["profiles"]:
            if not profile["user_roles"]:
                actual_order.append(None)
                continue
            role_id = profile["user_roles"][0]
            group_name = m.UserRole.objects.get(id=role_id).group.name
            actual_order.append(group_name)

        expected_order = [
            None,
            f"{self.account.pk}_Zulu role",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_Data manager",
        ]

        self.assertEqual(
            actual_order,
            expected_order,
            f"Users not sorted correctly by first role. Expected: {expected_order}, got: {actual_order}",
        )
