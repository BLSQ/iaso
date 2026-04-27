import typing

from django.contrib.auth.models import Group, Permission
from django.urls import reverse

from iaso import models as m
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.test import APITestCase, SwaggerTestCaseMixin


class BaseProfileAPITestCase(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.MODULES = [module.codename for module in MODULES]
        self.account = m.Account.objects.create(
            name="Global Health Initiative", modules=self.MODULES, enforce_password_validation=False
        )
        self.another_account = m.Account.objects.create(name="Another account", enforce_password_validation=False)

        # TODO : make the org unit creations shorter and reusable
        self.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=self.account,
        )
        datasource = m.DataSource.objects.create(name="Evil Empire")
        datasource.projects.add(self.project)
        self.datasource = datasource
        self.sub_unit_type = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        self.parent_org_unit_type = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        self.parent_org_unit_type.sub_unit_types.add(self.sub_unit_type)

        self.mock_multipolygon = None
        self.mock_point = None

        self.org_unit_group = m.Group.objects.create(name="Elite councils")
        self.datasource = datasource
        source_version_1 = m.SourceVersion.objects.create(data_source=datasource, number=1)
        self.account.default_version = source_version_1
        self.account.save()
        self.org_unit_from_sub_type = m.OrgUnit.objects.create(
            org_unit_type=self.sub_unit_type,
            version=source_version_1,
            name="Jedi Squad 1",
            geom=self.mock_multipolygon,
            simplified_geom=self.mock_multipolygon,
            catchment=self.mock_multipolygon,
            location=self.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref=None,
        )
        self.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        self.another_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.org_unit_type,
            name="Hôpital Général",
        )
        self.org_unit_from_parent_type = m.OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=source_version_1,
            name="Corruscant Jedi Council",
            geom=self.mock_multipolygon,
            simplified_geom=self.mock_multipolygon,
            catchment=self.mock_multipolygon,
            location=self.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="FooBarB4z00",
        )
        self.org_unit_from_parent_type.groups.set([self.org_unit_group])

        self.child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=source_version_1,
            name="Corruscant Jedi Council",
            geom=self.mock_multipolygon,
            simplified_geom=self.mock_multipolygon,
            catchment=self.mock_multipolygon,
            location=self.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            parent=self.org_unit_from_parent_type,
        )

        self.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )
        self.group = Group.objects.create(name="user role")
        self.group.permissions.add(self.permission)
        self.user_role = m.UserRole.objects.create(group=self.group, account=self.account)

        self.group_another_account = Group.objects.create(name="user role with another account")
        self.group_another_account.permissions.add(self.permission)
        self.user_role_another_account = m.UserRole.objects.create(
            group=self.group_another_account, account=self.another_account
        )

        # Users.
        self.jane = self.create_user_with_profile(
            first_name="Jane",
            last_name="Doe",
            username="janedoe",
            account=self.account,
            permissions=[CORE_FORMS_PERMISSION],
        )
        self.john = self.create_user_with_profile(username="johndoe", account=self.account, is_superuser=True)
        self.jim = self.create_user_with_profile(
            username="jim", account=self.account, permissions=[CORE_FORMS_PERMISSION, CORE_USERS_ADMIN_PERMISSION]
        )
        self.jam = self.create_user_with_profile(
            username="jam",
            account=self.account,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            language="en",
        )
        self.jom = self.create_user_with_profile(username="jom", account=self.account, permissions=[], language="fr")
        self.jum = self.create_user_with_profile(
            username="jum", account=self.account, permissions=[], projects=[self.project]
        )
        self.user_managed_geo_limit = self.create_user_with_profile(
            username="managedGeoLimit",
            account=self.account,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            org_units=[self.org_unit_from_parent_type],
        )
        self.team1 = m.Team.objects.create(project=self.project, name="team1", manager=self.jane)
        self.team1.users.add(self.jane)
        self.team2 = m.Team.objects.create(project=self.project, name="team2", manager=self.jim)
        self.team2.users.add(self.jim)
        self.user_managed_geo_limit.iaso_profile.user_roles.set([self.user_role, self.user_role_another_account])

        self.user_role_name = self.user_role.group.name.removeprefix(
            f"{self.user_managed_geo_limit.iaso_profile.account.pk}_"
        )
        self.user_role_another_account_name = self.user_role_another_account.group.name.removeprefix(
            f"{self.user_managed_geo_limit.iaso_profile.account.pk}_"
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

    def get_profile_list_retrieve_schema(self):
        res = self.client.get(reverse("swagger-schema"), data={"format": "json"})
        return res.json()["components"]["schemas"]["ProfileList"]

    def assertValidProfileData(self, data: typing.Mapping):
        self.assertResponseCompliantToSwagger(data, "ProfileRetrieve")

    def assertValidProfileListItemData(self, data: typing.Mapping):
        self.assertResponseCompliantToSwagger(data, "ProfileList")

    def assertValidProfileListItemData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "user_id", int)
        self.assertHasField(project_data, "user_display", str)

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

PROFILE_RETRIEVE_SCHEMA = {}
