import datetime

from unittest.mock import patch

import jsonschema
import pytz

from django.contrib import auth
from django.contrib.contenttypes.models import ContentType

from hat.audit.models import Modification
from iaso import models as m
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.test import APITestCase


user_schema = {
    "type": "object",
    "properties": {
        "user_id": {"type": "number"},
        "username": {"type": "string"},
        "first_name": {"type": "string"},
        "last_name": {"type": "string"},
    },
    "required": ["user_id", "username", "first_name", "last_name"],
}

location = {
    "type": "object",
    "properties": {"id": {"type": "number"}, "name": {"type": "string"}},
    "required": ["id", "name"],
}

PROFILE_LOG_LIST_SCHEMA = {
    "type": "object",
    "properties": {
        "count": {"type": "number"},
        "page": {"type": "number"},
        "pages": {"type": "number"},
        "limit": {"type": "number"},
        "has_previous": {"type": "boolean"},
        "has_next": {"type": "boolean"},
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "number"},
                    "created_at": {"type": "string"},
                    "user": user_schema,
                    "modified_by": user_schema,
                    "past_location": {"type": "array", "items": location, "minContains": 0},
                    "new_location": {"type": "array", "items": location, "minContains": 0},
                    "fields_modified": {"type": "array", "items": {"type": "string"}, "minContains": 0},
                },
                "required": [
                    "id",
                    "user",
                    "modified_by",
                    "past_location",
                    "new_location",
                    "fields_modified",
                    "created_at",
                ],
            },
        },
    },
    "required": ["count", "results", "has_next", "has_previous", "pages", "page", "limit"],
}

name_and_id = {
    "type": "object",
    "properties": {"name": {"type": "string"}, "id": {"type": "number"}},
    "required": ["name", "id"],
}

PROFILE_LOG_DETAIL_SCHEMA = {
    "type": "object",
    "required": ["id", "object_id", "content_type", "past_value", "new_value"],
    "properties": {
        "id": {"type": "number"},
        "content_type": {"type": "number"},
        "object_id": {"type": "string"},
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
                            "email": {"type": "string"},
                            "account": {"type": "number"},
                            "dhis2_id": {"type": ["string", "null"]},
                            "language": {"type": ["string", "null"]},
                            "username": {"type": "string"},
                            "home_page": {"type": ["string", "null"]},
                            "organization": {"type": ["string", "null"]},
                            "last_name": {"type": ["string", "null"]},
                            "first_name": {"type": ["string", "null"]},
                            "deleted_at": {"type": ["string", "null"]},
                            "phone_number": {"type": "string"},
                            "user_permissions": {"array": {"items": {"type": "string"}, "minContains": 0}},
                            "org_units": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                            "projects": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                            "user_roles": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                        },
                        "required": [
                            "user",
                            "email",
                            "account",
                            "dhis2_id",
                            "language",
                            "username",
                            "home_page",
                            "organization",
                            "last_name",
                            "first_name",
                            "deleted_at",
                            "phone_number",
                            "user_permissions",
                            "org_units",
                            "projects",
                            "user_roles",
                        ],
                    },
                },
                "required": ["pk", "fields"],
            },
            "minContains": 1,
            "maxContains": 1,
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
                            "email": {"type": "string"},
                            "account": {"type": "number"},
                            "dhis2_id": {"type": ["string", "null"]},
                            "language": {"type": ["string", "null"]},
                            "username": {"type": "string"},
                            "home_page": {"type": ["string", "null"]},
                            "organization": {"type": ["string", "null"]},
                            "last_name": {"type": ["string", "null"]},
                            "first_name": {"type": ["string", "null"]},
                            "deleted_at": {"type": ["string", "null"]},
                            "phone_number": {"type": "string"},
                            "user_permissions": {"array": {"items": {"type": "string"}, "minContains": 0}},
                            "org_units": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                            "projects": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                            "user_roles": {"array": {"items": {"type": name_and_id}, "minContains": 0}},
                            "password_updated": {"type": "boolean"},
                        },
                        "required": [
                            "user",
                            "email",
                            "account",
                            "dhis2_id",
                            "language",
                            "username",
                            "home_page",
                            "organization",
                            "last_name",
                            "first_name",
                            "deleted_at",
                            "phone_number",
                            "user_permissions",
                            "org_units",
                            "projects",
                            "user_roles",
                            "password_updated",
                        ],
                    },
                },
                "required": ["pk", "fields"],
            },
            "minContains": 1,
            "maxContains": 1,
        },
    },
}


class ProfileLogsTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.MODULES = [module.codename for module in MODULES]
        cls.account = m.Account.objects.create(name="Main account", modules=cls.MODULES)
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.project_1 = m.Project.objects.create(name="Project 1", account=cls.account, app_id="project_1")
        cls.project_2 = m.Project.objects.create(name="Project 2", account=cls.account, app_id="project_2")
        source = m.DataSource.objects.create(name="Main data source")
        source.projects.add(cls.project_1)
        source.projects.add(cls.project_2)
        cls.source = source
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org Unit Type", short_name="outype")
        cls.version_1 = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        cls.account.default_version = cls.version_1
        cls.account.save()

        group = auth.models.Group.objects.create(name="Group1")
        cls.user_role = m.UserRole.objects.create(group=group, account=cls.account)

        cls.org_unit_1 = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type,
            version=cls.version_1,
            name="Org unit 1",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="FooBarB4z00",
        )
        cls.org_unit_2 = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type,
            version=cls.version_1,
            name="Org unit 2",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="FooBarB4z00",
        )
        # Users.
        cls.user_with_permission_1 = cls.create_user_with_profile(
            username="janedoe", account=cls.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        cls.user_with_permission_2 = cls.create_user_with_profile(
            username="bordoe", account=cls.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        cls.user_without_permission = cls.create_user_with_profile(
            username="jim", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.edited_user_1 = cls.create_user_with_profile(
            username="jam",
            account=cls.account,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
            language="en",
        )
        cls.edited_user_2 = cls.create_user_with_profile(
            username="jom", account=cls.account, permissions=[], language="fr"
        )
        cls.content_type = ContentType.objects.get(
            app_label="iaso",
            model="profile",
        )
        date1 = datetime.datetime(2020, 2, 10, 0, 0, 5, tzinfo=pytz.UTC)
        date2 = datetime.datetime(2020, 2, 15, 0, 0, 5, tzinfo=pytz.UTC)
        # date3 = datetime.datetime(2020, 2, 15, 0, 0, 5, tzinfo=pytz.UTC)
        # Logs
        # by user 1 for editable user 1 with org unit 1 before date
        with patch("django.utils.timezone.now", lambda: date1):
            cls.log_1 = Modification.objects.create(
                user=cls.user_with_permission_1,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_1.id],
                            "user_roles": [cls.user_role.id],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Ali",
                            "last_name": "G",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [cls.user_role.id],
                            "org_units": [cls.org_unit_1.id],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Sacha",  # Changed
                            "last_name": "Baron Cohen",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                            "password_updated": True,  # Changed
                        },
                    }
                ],
            )
        # by user 1 for editabe user 1 with org unit 1 after date
        with patch("django.utils.timezone.now", lambda: date2):
            cls.log_2 = Modification.objects.create(
                user=cls.user_with_permission_1,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_1.id],
                            "user_roles": [],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Sacha",
                            "last_name": "Baron Cohen",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [],
                            "org_units": [cls.org_unit_1.id],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Mel",  # Changed
                            "last_name": "Brooks",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "password_updated": True,  # Changed
                            "organization": "Bluesquare",  # Changed
                        },
                    }
                ],
            )
        # by user 1 for editable user 2 with org unit 2 before date
        with patch("django.utils.timezone.now", lambda: date1):
            cls.log_3 = Modification.objects.create(
                user=cls.user_with_permission_1,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_2.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_2.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_1.id],
                            "user_roles": [],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_2.username,
                            "first_name": "Sacha",
                            "last_name": "Baron Cohen",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_2.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_2.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [],
                            "org_units": [cls.org_unit_2.id],  # Changed
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_2.username,
                            "first_name": "Mel",  # Changed
                            "last_name": "Brooks",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "password_updated": True,  # Changed
                            "organization": "",
                        },
                    }
                ],
                created_at=date1,
            )
        # by user 2 for editable user 1 with org unit 2 before date
        with patch("django.utils.timezone.now", lambda: date1):
            cls.log_4 = Modification.objects.create(
                user=cls.user_with_permission_2,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_2.id],
                            "user_roles": [],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Johnny",
                            "last_name": "Cage",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [],
                            "org_units": [cls.org_unit_2.id],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Liu",  # Changed
                            "last_name": "Kang",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "password_updated": True,  # Changed
                            "organization": "",
                        },
                    }
                ],
            )
        # by user 2 for editable user 1 with org unit 2 after date
        with patch("django.utils.timezone.now", lambda: date2):
            cls.log_5 = Modification.objects.create(
                user=cls.user_with_permission_2,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_2.id],
                            "user_roles": [],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Shao",
                            "last_name": "Kahn",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_1.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_1.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [],
                            "org_units": [cls.org_unit_1.id],  # Changed
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_1.username,
                            "first_name": "Shang",  # Changed
                            "last_name": "Tsung",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "password_updated": True,  # Changed
                            "organization": "",
                        },
                    }
                ],
            )
        # by user 2 for editable user 2 with org unit 1 after date
        with patch("django.utils.timezone.now", lambda: date2):
            cls.log_6 = Modification.objects.create(
                user=cls.user_with_permission_2,
                object_id=str(cls.edited_user_1.iaso_profile.id),
                source="API",
                content_type=cls.content_type,
                past_value=[
                    {
                        "pk": cls.edited_user_2.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_2.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "org_units": [cls.org_unit_1.id],
                            "user_roles": [],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_2.username,
                            "first_name": "",
                            "last_name": "",
                            "deleted_at": None,
                            "home_page": "",
                            "organization": "",
                        },
                    }
                ],
                new_value=[
                    {
                        "pk": cls.edited_user_2.iaso_profile.id,
                        "fields": {
                            "user": cls.edited_user_2.id,
                            "email": "",
                            "dhis2_id": "12345",
                            "account": cls.account.id,
                            "language": "fr",
                            "projects": [cls.project_1.id],
                            "user_roles": [],
                            "org_units": [cls.org_unit_1.id],
                            "user_permissions": ["iaso_fictional_permission"],
                            "phone_number": "+32485996633",
                            "username": cls.edited_user_2.username,
                            "first_name": "Kung",  # Changed
                            "last_name": "Lao",  # Changed
                            "deleted_at": None,
                            "home_page": "",
                            "password_updated": False,
                            "organization": "",
                        },
                    }
                ],
            )

    def test_unauthenticated_user(self):
        """GET /api/userlogs/ anonymous user --> 401"""
        response = self.client.get("/api/userlogs/")
        self.assertJSONResponse(response, 401)

    def test_user_no_permission(self):
        """GET /api/userlogs/ without USERS_ADMIN permission --> 403"""
        self.client.force_authenticate(self.user_without_permission)
        response = self.client.get("/api/userlogs/")
        self.assertJSONResponse(response, 403)

    def test_results_filtered_by_account(self):
        pass

    def test_get_list(self):
        """GET /api/userlogs/ with USERS_ADMIN permission - golden path"""
        self.client.force_authenticate(self.user_with_permission_1)
        response = self.client.get("/api/userlogs/")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 6)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    def test_filters(self):
        """GET /api/userlogs/ with USERS_ADMIN permission
        Test filters on users, modified by, location and dates"

        """
        self.client.force_authenticate(self.user_with_permission_1)
        response = self.client.get(f"/api/userlogs/?user_ids={self.edited_user_1.id}")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 4)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        response = self.client.get(
            f"/api/userlogs/?user_ids={self.edited_user_1.id}&modified_by={self.user_with_permission_1.id}"
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 2)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        response = self.client.get(f"/api/userlogs/?user_ids={self.edited_user_1.id}&org_unit_id={self.org_unit_2.id}")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 2)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        response = self.client.get(
            f"/api/userlogs/?user_ids={self.edited_user_1.id}&modified_by={self.user_with_permission_1.id}&created_at_before=2020-02-14"
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 1)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        response = self.client.get(
            f"/api/userlogs/?user_ids={self.edited_user_1.id}&modified_by={self.user_with_permission_1.id}&created_at_after=2020-02-14"
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 1)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        results = data["results"]
        self.assertEqual(len(results), 1)
        user = results[0]["user"]
        self.assertEqual(user["id"], self.edited_user_1.iaso_profile.id)
        self.assertEqual(user["user_id"], self.edited_user_1.id)
        self.assertEqual(user["username"], self.edited_user_1.username)
        self.assertEqual(user["first_name"], self.edited_user_1.first_name)
        self.assertEqual(user["last_name"], self.edited_user_1.last_name)
        modified_by = results[0]["modified_by"]
        self.assertEqual(modified_by["id"], self.user_with_permission_1.iaso_profile.id)
        self.assertEqual(modified_by["user_id"], self.user_with_permission_1.id)
        self.assertEqual(modified_by["username"], self.user_with_permission_1.username)
        self.assertEqual(modified_by["first_name"], self.user_with_permission_1.first_name)
        self.assertEqual(modified_by["last_name"], self.user_with_permission_1.last_name)
        past_location = results[0]["past_location"][0]
        self.assertEqual(past_location["name"], self.org_unit_1.name)
        self.assertEqual(past_location["id"], self.org_unit_1.id)
        new_location = results[0]["new_location"][0]
        self.assertEqual(new_location["name"], self.org_unit_1.name)
        self.assertEqual(new_location["id"], self.org_unit_1.id)
        fields_modified = results[0]["fields_modified"]
        self.assertListEqual(fields_modified, ["first_name", "last_name", "organization", "password"])

        response = self.client.get(
            f"/api/userlogs/?user_ids={self.edited_user_1.id}&modified_by={self.user_with_permission_1.id}&created_at_after=2020-02-14&created_at_before=2020-02-09"
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["count"], 0)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        results = data["results"]
        self.assertEqual(results, [])

    def test_retrieve(self):
        """GET /api/userlogs/{id} with USERS_ADMIN permission - golden path"""
        self.client.force_authenticate(self.user_with_permission_1)
        response = self.client.get(f"/api/userlogs/{self.log_1.id}/")
        data = self.assertJSONResponse(response, 200)
        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_DETAIL_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))
        self.assertEqual(data["id"], self.log_1.id)
        self.assertEqual(data["user"], self.log_1.user.id)
        self.assertEqual(data["source"], self.log_1.source)
        self.assertEqual(data["object_id"], self.log_1.object_id)

        past_value = data["past_value"][0]
        self.assertEqual(past_value["pk"], self.log_1.past_value[0]["pk"])

        past_value_fields = past_value["fields"]
        self.assertEqual(past_value_fields["user"], self.log_1.past_value[0]["fields"]["user"])
        self.assertEqual(past_value_fields["account"], self.log_1.user.iaso_profile.account.id)
        self.assertEqual(past_value_fields["email"], self.log_1.past_value[0]["fields"]["email"])
        self.assertEqual(past_value_fields["username"], self.log_1.past_value[0]["fields"]["username"])
        self.assertEqual(past_value_fields["first_name"], self.log_1.past_value[0]["fields"]["first_name"])
        self.assertEqual(past_value_fields["last_name"], self.log_1.past_value[0]["fields"]["last_name"])
        self.assertEqual(past_value_fields["home_page"], self.log_1.past_value[0]["fields"]["home_page"])
        self.assertEqual(past_value_fields["organization"], self.log_1.past_value[0]["fields"]["organization"])
        self.assertEqual(past_value_fields["phone_number"], self.log_1.past_value[0]["fields"]["phone_number"])
        self.assertEqual(past_value_fields["deleted_at"], self.log_1.past_value[0]["fields"]["deleted_at"])
        self.assertEqual(past_value_fields["user_permissions"], self.log_1.past_value[0]["fields"]["user_permissions"])
        self.assertEqual(len(past_value_fields["org_units"]), 1)
        self.assertEqual(past_value_fields["org_units"][0], {"id": self.org_unit_1.id, "name": self.org_unit_1.name})
        self.assertEqual(len(past_value_fields["projects"]), 1)
        self.assertEqual(past_value_fields["projects"][0], {"id": self.project_1.id, "name": self.project_1.name})
        self.assertEqual(len(past_value_fields["user_roles"]), 1)
        self.assertEqual(
            past_value_fields["user_roles"][0],
            {"id": self.user_role.id, "name": m.UserRole.remove_user_role_name_prefix(self.user_role.group.name)},
        )

        new_value = data["new_value"][0]
        self.assertEqual(new_value["pk"], self.log_1.new_value[0]["pk"])

        new_value_fields = new_value["fields"]
        self.assertEqual(new_value_fields["user"], self.log_1.new_value[0]["fields"]["user"])
        self.assertEqual(new_value_fields["account"], self.log_1.user.iaso_profile.account.id)
        self.assertEqual(new_value_fields["email"], self.log_1.new_value[0]["fields"]["email"])
        self.assertEqual(new_value_fields["username"], self.log_1.new_value[0]["fields"]["username"])
        self.assertEqual(new_value_fields["first_name"], self.log_1.new_value[0]["fields"]["first_name"])
        self.assertEqual(new_value_fields["last_name"], self.log_1.new_value[0]["fields"]["last_name"])
        self.assertEqual(new_value_fields["home_page"], self.log_1.new_value[0]["fields"]["home_page"])
        self.assertEqual(new_value_fields["organization"], self.log_1.new_value[0]["fields"]["organization"])
        self.assertEqual(new_value_fields["phone_number"], self.log_1.new_value[0]["fields"]["phone_number"])
        self.assertEqual(new_value_fields["deleted_at"], self.log_1.new_value[0]["fields"]["deleted_at"])
        self.assertEqual(new_value_fields["user_permissions"], self.log_1.new_value[0]["fields"]["user_permissions"])
        self.assertEqual(len(new_value_fields["org_units"]), 1)
        self.assertEqual(new_value_fields["org_units"][0], {"id": self.org_unit_1.id, "name": self.org_unit_1.name})
        self.assertEqual(len(new_value_fields["projects"]), 1)
        self.assertEqual(new_value_fields["projects"][0], {"id": self.project_1.id, "name": self.project_1.name})
        self.assertEqual(len(new_value_fields["user_roles"]), 1)
        self.assertEqual(
            new_value_fields["user_roles"][0],
            {"id": self.user_role.id, "name": m.UserRole.remove_user_role_name_prefix(self.user_role.group.name)},
        )

    def test_retrieve_without_update(self):
        """GET /api/userlogs/{id} for a log without updates should not crash"""
        self.client.force_authenticate(self.user_with_permission_1)

        # Create a log without updates
        log_without_update = Modification.objects.create(
            user=self.user_with_permission_1,
            object_id=str(self.edited_user_1.iaso_profile.id),
            source="API",
            content_type=self.content_type,
            past_value=[],
            new_value=[
                {
                    "pk": self.edited_user_1.iaso_profile.id,
                    "fields": {
                        "user": self.edited_user_1.id,
                        "account": self.edited_user_1.iaso_profile.account.id,
                        "email": "",
                        "username": self.edited_user_1.username,
                        "first_name": self.edited_user_1.first_name,
                        "last_name": self.edited_user_1.last_name,
                        "home_page": "",
                        "organization": "",
                        "phone_number": "",
                        "deleted_at": None,
                        "user_permissions": [],
                        "org_units": [],
                        "projects": [],
                        "user_roles": [],
                        "language": "",
                        "dhis2_id": "",
                        "password_updated": False,
                    },
                }
            ],
        )

        response = self.client.get(f"/api/userlogs/{log_without_update.id}/")
        data = self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=data, schema=PROFILE_LOG_DETAIL_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    def test_retrieve_unauthenticated(self):
        """GET /api/userlogs/{id} without authentication should return 401"""
        self.client.force_authenticate(user=None)
        response = self.client.get(f"/api/userlogs/{self.log_1.id}/")
        self.assertJSONResponse(response, 401)

    def test_retrieve_without_permission(self):
        """GET /api/userlogs/{id} without USERS_ADMIN permission should return 403"""
        self.client.force_authenticate(self.user_without_permission)
        response = self.client.get(f"/api/userlogs/{self.log_1.id}/")
        self.assertJSONResponse(response, 403)

    def test_retrieve_unknown_log(self):
        """GET /api/userlogs/{id} with an unknown log ID should return 404"""
        self.client.force_authenticate(self.user_with_permission_1)
        unknown_id = max(Modification.objects.all().values_list("id", flat=True)) + 1
        response = self.client.get(f"/api/userlogs/{unknown_id}/")
        self.assertJSONResponse(response, 404)
