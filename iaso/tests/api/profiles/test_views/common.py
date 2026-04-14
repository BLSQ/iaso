import typing

from django.contrib.auth.models import Group, Permission

from iaso import models as m
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.test import APITestCase


class BaseProfileAPITestCase(APITestCase):
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
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.another_org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type,
            name="Hôpital Général",
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
            first_name="Jane",
            last_name="Doe",
            username="janedoe",
            account=cls.account,
            permissions=[CORE_FORMS_PERMISSION],
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
        cls.team1 = m.Team.objects.create(project=cls.project, name="team1", manager=cls.jane)
        cls.team1.users.add(cls.jane)
        cls.team2 = m.Team.objects.create(project=cls.project, name="team2", manager=cls.jim)
        cls.team2.users.add(cls.jim)
        cls.user_managed_geo_limit.iaso_profile.user_roles.set([cls.user_role, cls.user_role_another_account])

        cls.user_role_name = cls.user_role.group.name.removeprefix(
            f"{cls.user_managed_geo_limit.iaso_profile.account.pk}_"
        )
        cls.user_role_another_account_name = cls.user_role_another_account.group.name.removeprefix(
            f"{cls.user_managed_geo_limit.iaso_profile.account.pk}_"
        )

    def assertValidProfileListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="results",
            paginated=paginated,
        )

        for profile_data in list_data["results"]:
            self.assertValidProfileListItemData(profile_data)

    def assertValidProfileData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "firstName", str)
        self.assertHasField(project_data, "lastName", str)
        self.assertHasField(project_data, "email", str)
        self.assertHasField(project_data, "color", str)

    def assertValidProfileListItemData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "userId", int)
        self.assertHasField(project_data, "userDisplay", str)

    def get_new_user_data(self):
        user_name = "audit_user"
        pwd = "admin1234lol"
        first_name = "audit_user_first_name"
        last_name = "audit_user_last_name"
        email = "audit@test.com"
        organization = "Bluesquare"
        org_units = [f"{self.org_unit_from_parent_type.id}"]
        language = "fr"
        home_page = "/forms/list"
        dhis2_id = "666666666666"
        user_roles = [self.user_role.id]
        user_roles_permissions = [self.user_role.id]
        user_permissions = [CORE_ORG_UNITS_READ_PERMISSION.codename]
        send_email_invitation = False
        projects = [self.project.id]
        phone_number = "+32475888888"
        country_code = "be"
        data = {
            "userName": user_name,
            "password": pwd,
            "firstName": first_name,
            "lastName": last_name,
            "sendEmailInvitation": send_email_invitation,
            "email": email,
            "organization": organization,
            "language": language,
            "homePage": home_page,
            "dhis2Id": dhis2_id,
            "permissions": [],  # This looks legacy from an older version of the API
            "userPermissions": user_permissions,
            "projects": projects,
            "phoneNumber": phone_number,
            "countryCode": country_code,
            "userRoles": user_roles,
            "userRolesPermissions": user_roles_permissions,
            "orgUnits": org_units,
        }
        return data


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
                        },
                        "required": ["user"],
                    },
                },
            },
        },
    },
    "required": ["id", "user", "content_type", "source", "object_id", "created_at", "past_value", "new_value"],
}
