import csv
import io
import json

from unittest.mock import patch

import jsonschema

from django.contrib.auth.models import Permission, User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers

from iaso import models as m
from iaso.api.profiles.bulk_create_users import BulkCreateUserFromCsvViewSet
from iaso.models import BulkCreateUserCsvFile, Profile, Team
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_SUBMISSIONS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
    CORE_USERS_ROLES_PERMISSION,
)
from iaso.test import APITestCase
from iaso.tests.api.test_profiles import PROFILE_LOG_SCHEMA


BASE_URL = "/api/bulkcreateuser/"


class BulkCreateCsvTestCase(APITestCase):
    CSV_HEADER = [
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
        "teams",
        "phone_number",
        "organization",
        "editable_org_unit_types",
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = m.DataSource.objects.create(name="Source")
        version1 = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        version2 = m.SourceVersion.objects.create(data_source=cls.source, number=2)
        cls.MODULES = [module.codename for module in MODULES]
        account1 = m.Account.objects.create(name="Account 1")
        cls.project = m.Project.objects.create(name="Project name", app_id="project.id", account=account1)
        cls.project2 = m.Project.objects.create(name="Project 2", app_id="project.2", account=account1)
        account1.default_version = version1
        account1.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda",
            account=account1,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_USERS_ADMIN_PERMISSION, CORE_USERS_ROLES_PERMISSION],
        )
        cls.obi = cls.create_user_with_profile(username="obi", account=account1)
        cls.john = cls.create_user_with_profile(username="johndoe", account=account1, is_superuser=True)

        cls.org_unit_type_region = m.OrgUnitType.objects.create(name="Region")
        cls.org_unit_type_region.projects.add(cls.project)
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        cls.org_unit_type_country.projects.add(cls.project)

        cls.org_unit_parent = m.OrgUnit.objects.create(
            name="Parent org unit", id=1111, version=version1, source_ref="foo"
        )
        cls.org_unit_child = m.OrgUnit.objects.create(
            name="Child org unit", id=1112, version=version1, source_ref="foo", parent=cls.org_unit_parent
        )

        cls.user_managed_geo_limit = cls.create_user_with_profile(
            username="user_managed_geo_limit",
            account=account1,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
        )

        cls.org_unit1 = m.OrgUnit.objects.create(name="Coruscant Jedi Council", version=version1, source_ref="foo")
        cls.org_unit2 = m.OrgUnit.objects.create(name="Tatooine", version=version1, source_ref="bar")
        cls.org_unit3 = m.OrgUnit.objects.create(name="Dagobah", id=9999, version=version1, source_ref="baz")
        cls.org_unit4 = m.OrgUnit.objects.create(name="Solana", version=version1)

        cls.yoda.iaso_profile.org_units.set([cls.org_unit1, cls.org_unit2, cls.org_unit3, cls.org_unit4])

        m.OrgUnit.objects.create(name="chiloe", id=10244, version=version1, parent=cls.org_unit2)
        m.OrgUnit.objects.create(name="chiloe", id=10934, version=version2)

        account2 = m.Account.objects.create(name="Account 2")
        cls.create_user_with_profile(
            username="han solo",
            account=account2,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_USERS_ADMIN_PERMISSION],
        )

        cls.version1 = version1
        cls.version2 = version2
        cls.account1 = account1

    def setUp(self):
        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

    def test_upload_valid_csv(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        context = {"org_unit_type_id": self.org_unit_type_region.id}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures", fixture_name="test_user_bulk_create_valid.csv", context=context
        )

        test_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )

        with self.assertNumQueries(85):
            response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        users = User.objects.all()
        profiles = Profile.objects.all()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 8)
        self.assertEqual(len(profiles), 8)
        new_user_1 = users.get(username="broly")
        org_unit_ids = [org_unit.id for org_unit in list(new_user_1.iaso_profile.org_units.all())]
        self.assertEqual(new_user_1.email, "biobroly@bluesquarehub.com")
        self.assertEqual(new_user_1.first_name, "broly")
        self.assertEqual(new_user_1.last_name, "bio")
        self.assertEqual(new_user_1.iaso_profile.language, "fr")
        self.assertEqual(new_user_1.iaso_profile.dhis2_id, "dhis2_id_1")
        self.assertEqual(org_unit_ids, [9999])

        # Checking that the file was uploaded to the right location
        file_upload = m.BulkCreateUserCsvFile.objects.first()
        # The API endpoint changes the file name after processing - doing this with file.save() generates a random suffix
        # This means that it's impossible to check for strict equality
        expected_file_name = f"{self.account1.short_sanitized_name}_{self.account1.id}/bulk_create_user_csv/{file_upload.created_at.strftime('%Y_%m')}/{file_upload.id}"
        self.assertTrue(file_upload.file.name.startswith(expected_file_name))

    def test_upload_valid_csv_with_perms(self):
        with self.assertNumQueries(47):
            self.client.force_authenticate(self.yoda)
            self.source.projects.set([self.project])

            iaso_forms = Permission.objects.get(codename="iaso_forms")
            iaso_submissions = Permission.objects.get(codename="iaso_submissions")

            self.account1.modules = self.MODULES
            self.account1.save()

            self.account1.refresh_from_db()
            with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_perm.csv") as csv_users:
                response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

            pollux = User.objects.get(username="pollux")
            pollux_perms = pollux.user_permissions.all()
            has_perms = False
            if iaso_forms and iaso_submissions in pollux_perms:
                has_perms = True

            self.assertEqual(response.status_code, 200)
            self.assertEqual(has_perms, True)

    def test_upload_invalid_mail_csv(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_mail.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        self.assertEqual(len(validation_errors), 1)
        self.assertEqual(validation_errors[0]["row"], 3)
        self.assertIn("email", validation_errors[0]["errors"])

    def test_upload_without_mail_must_work(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_no_mail.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["Accounts created"], 3)

    def test_upload_invalid_orgunit_id(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        # Row 1 has invalid orgunit ID, rows 2-3 have invalid source_ref
        self.assertEqual(len(validation_errors), 3)

        # Check first error - invalid orgunit ID
        self.assertEqual(validation_errors[0]["row"], 1)
        self.assertIn("orgunit", validation_errors[0]["errors"])
        self.assertIn("99998", validation_errors[0]["errors"]["orgunit"])

        # Check second and third errors - invalid source_ref
        self.assertEqual(validation_errors[1]["row"], 2)
        self.assertIn("orgunit__source_ref", validation_errors[1]["errors"])
        self.assertEqual(validation_errors[2]["row"], 3)
        self.assertIn("orgunit__source_ref", validation_errors[2]["errors"])

    def test_upload_user_already_exists(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        user = User.objects.create(
            username="broly", first_name="broly", last_name="Smith", email="broly-smith@bluesquarehub.com"
        )
        user.save()

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        # Should have error for existing username
        username_error = next((e for e in validation_errors if "username" in e.get("errors", {})), None)
        self.assertIsNotNone(username_error)
        self.assertIn("broly", username_error["errors"]["username"])

    def test_upload_invalid_csv_dont_create_entries(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        self.assertTrue(len(validation_errors) > 0)
        self.assertEqual(len(users), 5)
        self.assertEqual(len(profiles), 5)

    def test_can_create_user_with_managed_geo_limit_permission(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_managed_geo_limit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 200)

    def test_cant_create_user_not_org_unit_in_the_pyramid_with_managed_geo_limit_permission(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        self.source.projects.set([self.project])
        self.user_managed_geo_limit.iaso_profile.org_units.add(self.org_unit1)
        self.user_managed_geo_limit.save()

        with open("iaso/tests/fixtures/test_user_bulk_create_managed_geo_limit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_user_cant_access_without_permission(self):
        self.client.force_authenticate(self.obi)
        self.source.projects.set([self.project])

        response = self.client.get(f"{BASE_URL}")

        self.assertEqual(response.status_code, 403)

    def test_user_can_access_with_managed_geo_limit_permission(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        self.source.projects.set([self.project])

        response = self.client.get(f"{BASE_URL}")

        self.assertEqual(response.status_code, 200)

    def test_password_delete_after_import(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        pswd_deleted = True

        context = {"org_unit_type_id": self.org_unit_type_region.id}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures", fixture_name="test_user_bulk_create_valid.csv", context=context
        )

        test_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )

        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        csv_file = BulkCreateUserCsvFile.objects.last()

        reader = csv.reader(csv_file.file.open("r"))
        i = 0
        csv_indexes = []
        for row in reader:
            if i > 0:
                pswd_deleted = True if row[csv_indexes.index("password")] == "" else False
            else:
                csv_indexes = row
            i += 1

        self.assertEqual(pswd_deleted, True)
        self.assertEqual(response.status_code, 200)

    def test_upload_invalid_password(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_password.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        password_error = next((e for e in validation_errors if "password" in e.get("errors", {})), None)
        self.assertIsNotNone(password_error)
        self.assertIn("too short", password_error["errors"]["password"])

    def test_created_users_can_login(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        context = {"org_unit_type_id": self.org_unit_type_region.id}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures", fixture_name="test_user_bulk_create_valid.csv", context=context
        )

        test_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")
        self.assertEqual(response.status_code, 200)

        login_data = {"username": "broly", "password": "yodnj!30dln"}

        login_response = self.client.post("/api/token/", data=login_data, format="json")

        self.assertEqual(login_response.status_code, 200)

    def test_upload_invalid_orgunit_name(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_ou_name.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        orgunit_error = next((e for e in validation_errors if "orgunit" in e.get("errors", {})), None)
        self.assertIsNotNone(orgunit_error)
        self.assertIn("Bazarre", orgunit_error["errors"]["orgunit"])

    def test_users_profiles_have_right_ou(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        context = {"org_unit_type_id": self.org_unit_type_region.id}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures", fixture_name="test_user_bulk_create_valid.csv", context=context
        )

        test_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        broly_ou = Profile.objects.get(user=User.objects.get(username="broly").id).org_units.all()
        ou_list = []

        for ou in broly_ou:
            ou_list.append(ou.id)

        ferdinand_ou = Profile.objects.get(user=User.objects.get(username="ferdinand").id).org_units.all()
        ou_f_list = []

        for ou in ferdinand_ou:
            ou_f_list.append(ou.id)

        self.assertEqual(ou_list, [9999])
        self.assertCountEqual(ou_f_list, [self.org_unit1.id, self.org_unit2.id, 9999])
        self.assertEqual(response.status_code, 200)

    def test_cant_create_user_without_access_to_ou(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_cant_create_user_without_ou_profile(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_creator_no_access_to_ou.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        validation_errors = response.json()["validation_errors"]
        orgunit_error = next((e for e in validation_errors if "orgunit" in e.get("errors", {})), None)
        self.assertIsNotNone(orgunit_error)
        # The error should indicate access issue or invalid org unit
        self.assertIn("10244", orgunit_error["errors"]["orgunit"])

    def test_upload_duplicate_ou_names(self):
        # This test detects if in case there is multiple OU with same name in different sources the right OU is taken.
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_user_duplicate_ou_names.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(User.objects.filter(username="jan").exists(), True)

        created_user = User.objects.get(username="jan")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(created_user.iaso_profile.org_units.all()), 1)
        self.assertEqual(created_user.iaso_profile.org_units.all()[0].name, "chiloe")
        self.assertEqual(created_user.iaso_profile.org_units.all()[0].id, 10244)

    def test_can_create_user_with_ou_that_are_child_of_ou(self):
        # This test ensure that we can create users with access to ou child not explicitly added to the creator
        # access ou list ( ou is a child of ou in the user ou list )
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_user_access_to_child_ou.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(username="jan").exists(), True)

        created_user = User.objects.get(username="jan")

        self.assertEqual(len(created_user.iaso_profile.org_units.all()), 1)
        self.assertEqual(created_user.iaso_profile.org_units.all()[0].name, "chiloe")
        self.assertEqual(created_user.iaso_profile.org_units.all()[0].id, 10244)

    def test_upload_semicolon_separated_csv(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_semicolon.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 7)
        self.assertEqual(len(profiles), 7)
        new_user_1 = users.get(username="broly")
        new_user_2 = users.get(username="cyrus")
        org_unit_ids = [org_unit.id for org_unit in list(new_user_1.iaso_profile.org_units.all())]
        self.assertEqual(new_user_1.email, "biobroly@bluesquarehub.com")
        self.assertEqual(new_user_2.email, "cyruswashington@bluesquarehub.com")
        self.assertEqual(new_user_1.first_name, "broly")
        self.assertEqual(new_user_1.last_name, "bio")
        self.assertEqual(new_user_2.first_name, "cyrus")
        self.assertEqual(new_user_2.last_name, "washington")
        self.assertEqual(new_user_1.iaso_profile.language, "fr")
        self.assertEqual(new_user_1.iaso_profile.dhis2_id, "dhis2_id_1")
        self.assertEqual(new_user_2.iaso_profile.dhis2_id, "dhis2_id_6")
        self.assertEqual(org_unit_ids, [9999])

        self.assertEqual(response.data["Accounts created"], 2)

    def test_upload_csv_with_missing_column(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_missing_columns.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "Something is wrong with your CSV File. Possibly missing {'permissions'} column(s)."},
        )

    def test_create_user_with_roles(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        manager = {"name": "manager"}
        self.client.post("/api/userroles/", data=manager)

        area_manager = {"name": "area_manager"}
        self.client.post("/api/userroles/", data=area_manager)

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_roles.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 7)
        self.assertEqual(len(profiles), 7)
        new_user_1 = users.get(username="broly")
        new_user_2 = users.get(username="cyrus")
        new_user_1_user_role = new_user_1.iaso_profile.user_roles.all()
        new_user_2_user_roles = new_user_2.iaso_profile.user_roles.all()
        org_unit_ids = [org_unit.id for org_unit in list(new_user_1.iaso_profile.org_units.all())]
        self.assertEqual(new_user_1.email, "biobroly@bluesquarehub.com")
        self.assertEqual(new_user_2.email, "cyruswashington@bluesquarehub.com")
        self.assertEqual(new_user_1.first_name, "broly")
        self.assertEqual(new_user_1.last_name, "bio")
        self.assertEqual(new_user_2.first_name, "cyrus")
        self.assertEqual(new_user_2.last_name, "washington")
        self.assertEqual(new_user_1.iaso_profile.language, "fr")
        self.assertEqual(new_user_1.iaso_profile.dhis2_id, "dhis2_id_1")
        self.assertEqual(new_user_2.iaso_profile.dhis2_id, "dhis2_id_6")
        self.assertEqual(org_unit_ids, [9999])
        self.assertEqual(len(new_user_1_user_role), 1)
        self.assertEqual(len(new_user_1.groups.all()), 1)
        self.assertEqual(new_user_1.groups.all().first(), new_user_1_user_role.first().group)
        self.assertEqual(len(new_user_2_user_roles), 2)
        self.assertEqual(len(new_user_2.groups.all()), 2)
        self.assertCountEqual(
            [user_role.group for user_role in new_user_2_user_roles],
            [group for group in new_user_2.groups.all()],
        )
        self.assertEqual(response.data["Accounts created"], 2)

    def test_create_user_with_projects(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_projects.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")
        users = User.objects.all()
        profiles = Profile.objects.all()
        profile_1 = Profile.objects.get(user__username="broly")
        profile_2 = Profile.objects.get(user__username="cyrus")

        self.assertEqual(profile_1.projects.all()[0].name, "Project name")
        self.assertEqual(profile_2.projects.all()[0].name, "Project name")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 7)
        self.assertEqual(len(profiles), 7)
        new_user_1 = users.get(username="broly")
        new_user_2 = users.get(username="cyrus")
        org_unit_ids = [org_unit.id for org_unit in list(new_user_1.iaso_profile.org_units.all())]
        self.assertEqual(new_user_1.email, "biobroly@bluesquarehub.com")
        self.assertEqual(new_user_2.email, "cyruswashington@bluesquarehub.com")
        self.assertEqual(new_user_1.first_name, "broly")
        self.assertEqual(new_user_1.last_name, "bio")
        self.assertEqual(new_user_2.first_name, "cyrus")
        self.assertEqual(new_user_2.last_name, "washington")
        self.assertEqual(new_user_1.iaso_profile.language, "fr")
        self.assertEqual(new_user_1.iaso_profile.dhis2_id, "dhis2_id_1")
        self.assertEqual(new_user_2.iaso_profile.dhis2_id, "dhis2_id_6")
        self.assertEqual(org_unit_ids, [9999])
        self.assertEqual(response.data["Accounts created"], 2)

    def test_create_user_with_project_restrictions(self):
        self.source.projects.set([self.project, self.project2])

        with open("iaso/tests/fixtures/test_user_bulk_create_managed_geo_limit.csv") as csv_users:
            csv_reader = list(csv.reader(csv_users))

            csv_line_1 = csv_reader[1]
            csv_line_2 = csv_reader[2]
            csv_line_3 = csv_reader[3]

            username_index = 0
            projects_index = 12

            username_1 = csv_line_1[username_index]
            username_2 = csv_line_2[username_index]
            username_3 = csv_line_3[username_index]

            # Ensure the CSV tries to set `project` as an authorized project.
            self.assertEqual(csv_line_1[projects_index], self.project.name)
            self.assertEqual(csv_line_2[projects_index], self.project.name)

        self.user_managed_geo_limit.iaso_profile.projects.set([self.project2.id])  # Restrict user to `project2`.
        # Grant access to org_unit_child (1112) which is used in the CSV
        self.user_managed_geo_limit.iaso_profile.org_units.add(self.org_unit_child)
        self.assertTrue(self.user_managed_geo_limit.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertFalse(self.user_managed_geo_limit.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        self.client.force_authenticate(self.user_managed_geo_limit)
        with open("iaso/tests/fixtures/test_user_bulk_create_managed_geo_limit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")
            self.assertEqual(response.status_code, 200)

        # The current project restrictions of a `user` without the admin perm should be applied.
        # That means that projects in the CSV should've been skipped and new profiles should
        # end up having the same restriction as `user`.
        profile_1 = Profile.objects.get(user__username=username_1)
        self.assertEqual(1, profile_1.projects.count())
        self.assertEqual(profile_1.projects.first(), self.project2)
        profile_2 = Profile.objects.get(user__username=username_2)
        self.assertEqual(1, profile_2.projects.count())
        self.assertEqual(profile_2.projects.first(), self.project2)

        self.client.logout()
        User.objects.filter(username__in=[username_1, username_2, username_3]).delete()

        self.yoda.iaso_profile.projects.set([self.project2.id])  # Restrict user to `project2`.
        self.yoda.iaso_profile.org_units.set([self.org_unit_child])
        self.assertFalse(self.yoda.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertTrue(self.yoda.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/test_user_bulk_create_managed_geo_limit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")
            self.assertEqual(response.status_code, 200)

        # A `user` with the admin perm should be able to bypass project restrictions.
        # Here, the CSV content should be applied.
        profile_1 = Profile.objects.get(user__username=username_1)
        self.assertEqual(1, profile_1.projects.count())
        self.assertEqual(profile_1.projects.first(), self.project)
        profile_2 = Profile.objects.get(user__username=username_2)
        self.assertEqual(1, profile_2.projects.count())
        self.assertEqual(profile_2.projects.first(), self.project)
        profile_3 = Profile.objects.get(user__username=username_3)
        self.assertEqual(0, profile_3.projects.count())

    def test_should_create_user_with_the_correct_org_unit_from_source_ref(self):
        """
        Given that multiple instances of an OrgUnit exist, when attempting to link
        an OrgUnit based on its `source_ref` to a new user, then the OrgUnit that
        matches the "default source version" of the account should be selected.
        """
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        org_unit_a = m.OrgUnit.objects.create(name="Zakuul", source_ref="qux", version=self.version1)
        org_unit_b = m.OrgUnit.objects.create(name="Zakuul", source_ref="qux", version=self.version2)
        org_unit_c = m.OrgUnit.objects.create(name="Zakuul", source_ref="qux", version=None)
        self.yoda.iaso_profile.org_units.add(org_unit_a, org_unit_b, org_unit_c)
        self.yoda.iaso_profile.save()

        csv_str = io.StringIO()
        writer = csv.DictWriter(csv_str, fieldnames=self.CSV_HEADER)
        writer.writeheader()
        writer.writerow(
            {
                "username": "john",
                "password": "yodnj!30dln",
                "email": "john@foo.com",
                "first_name": "John",
                "last_name": "Doe",
                "orgunit": "",
                "orgunit__source_ref": "qux",
                "profile_language": "fr",
                "dhis2_id": "",
                "permissions": "",
                "user_roles": "",
                "projects": "",
                "teams": "",
                "phone_number": "",
                "organization": "",
                "editable_org_unit_types": "",
            }
        )
        csv_bytes = csv_str.getvalue().encode()
        csv_file = SimpleUploadedFile("users.csv", csv_bytes)

        response = self.client.post(f"{BASE_URL}", {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, 200)

        new_user = User.objects.get(email="john@foo.com")
        self.assertEqual(new_user.iaso_profile.account, self.account1)
        self.assertEqual(new_user.iaso_profile.org_units.count(), 1)
        self.assertEqual(new_user.iaso_profile.org_units.first(), org_unit_a)
        self.assertEqual(org_unit_a.version_id, self.account1.default_version_id)

    def test_valid_phone_number(self):
        phone_number = "+12345678912"
        expected_output = "+12345678912"
        result = BulkCreateUserFromCsvViewSet.validate_phone_number(phone_number)
        self.assertEqual(result, expected_output)

    def test_invalid_phone_number(self):
        invalid_phone_number = "+12345"

        with self.assertRaises(serializers.ValidationError) as raisedException:
            BulkCreateUserFromCsvViewSet.validate_phone_number(invalid_phone_number)

        exception_message = raisedException.exception.detail["error"]
        self.assertIn(f"Operation aborted. The phone number {invalid_phone_number} is invalid", exception_message)

    def test_number_parse_exception(self):
        phone_number = "This is not a phone number"
        with self.assertRaises(serializers.ValidationError) as raisedException:
            BulkCreateUserFromCsvViewSet.validate_phone_number(phone_number)

        exception_message = raisedException.exception.detail["error"]
        self.assertIn(f"Operation aborted. This '{phone_number}' is not a phone number", exception_message)

    def test_audit_log_on_save(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        self.account1.modules = self.MODULES
        self.account1.save()
        self.account1.refresh_from_db()
        # Manually adding user roles to avoid messing with other tests
        manager = {"name": "manager"}
        self.client.post("/api/userroles/", data=manager)

        area_manager = {"name": "area_manager"}
        self.client.post("/api/userroles/", data=area_manager)

        with open("iaso/tests/fixtures/test_user_bulk_create_all_fields.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")
        self.assertJSONResponse(response, 200)

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/logs/?contentType=iaso.profile&fields=past_value,new_value")
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        logs_for_new_users = [logs[0], logs[1], logs[2]]  # There's 3 users in the csv so we take the last 3 logs

        # Check that all users are logged
        user_names = [log["new_value"][0]["fields"]["username"] for log in logs_for_new_users]
        self.assertIn("bob", user_names)
        self.assertIn("bobette", user_names)
        self.assertIn("fanchon", user_names)

        # Check that fields have correct value (1 user)
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        past_value = log["past_value"]
        self.assertEqual(past_value, [])

        new_value = log["new_value"][0]["fields"]
        self.assertTrue(new_value["password_updated"])
        self.assertNotIn("password", new_value.keys())
        self.assertEqual(len(new_value["user_permissions"]), 1)
        self.assertIn("iaso_forms", new_value["user_permissions"])
        self.assertEqual(len(new_value["user_roles"]), 1)
        self.assertEqual(len(new_value["projects"]), 1)
        self.assertEqual(new_value["language"], "fr")
        self.assertEqual(new_value["dhis2_id"], "dhis2_id_3")
        self.assertEqual(len(new_value["org_units"]), 2)
        self.assertIn(self.org_unit3.id, new_value["org_units"])
        self.assertIn(self.org_unit2.id, new_value["org_units"])

    def test_bulk_create_user_with_single_team(self):
        self.client.force_authenticate(self.yoda)

        self.source.projects.set([self.project])

        team = Team.objects.create(name="Alpha Team", project=self.project, manager=self.yoda)

        context = {"org_unit_type_id": self.org_unit_type_region.id, "team_names": "Alpha Team"}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures",
            fixture_name="test_user_bulk_create_valid_with_multiple_teams.csv",
            context=context,
        )

        test_file = SimpleUploadedFile("test.csv", csv_content.encode("utf-8"), content_type="text/csv")
        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")
        self.assertEqual(response.status_code, 200)

        user = User.objects.get(username="rsfg")
        self.assertEqual(user.teams.count(), 1)
        self.assertEqual(user.teams.first().name, team.name)

    def test_bulk_create_user_with_multiple_teams(self):
        self.client.force_authenticate(self.yoda)

        self.source.projects.set([self.project])

        team1 = Team.objects.create(name="Alpha Team", project=self.project, manager=self.yoda)
        team2 = Team.objects.create(name="Beta Team", project=self.project, manager=self.yoda)

        context = {"org_unit_type_id": self.org_unit_type_region.id, "team_names": f"{team1.name}, {team2.name}"}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures",
            fixture_name="test_user_bulk_create_valid_with_multiple_teams.csv",
            context=context,
        )

        test_file = SimpleUploadedFile("test.csv", csv_content.encode("utf-8"), content_type="text/csv")

        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        self.assertEqual(response.status_code, 200)

        user = User.objects.get(username="rsfg")
        self.assertEqual(user.teams.count(), 2)

        user_team_names = list(user.teams.values_list("name", flat=True))
        self.assertIn("Alpha Team", user_team_names)
        self.assertIn("Beta Team", user_team_names)

    def test_bulk_create_user_fails_on_invalid_team(self):
        self.client.force_authenticate(self.yoda)

        self.source.projects.set([self.project])
        invalid_team_name = "Not a Team"

        context = {"org_unit_type_id": self.org_unit_type_region.id, "team_names": invalid_team_name}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures",
            fixture_name="test_user_bulk_create_valid_with_multiple_teams.csv",
            context=context,
        )

        test_file = SimpleUploadedFile("test.csv", csv_content.encode("utf-8"), content_type="text/csv")

        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        self.assertEqual(response.status_code, 400)

        expected_error = f"Row 2: Team '{invalid_team_name}' does not exist."
        self.assertEqual(response.json()["error"], expected_error)

    def test_bulk_create_user_cannot_assign_team_from_another_account(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        account2 = m.Account.objects.get(name="Account 2")
        han_solo = User.objects.get(username="han solo")

        project_acc2 = m.Project.objects.create(name="Project Acc 2", account=account2, app_id="acc2.app")

        secret_team_name = "Account 2 Team"
        Team.objects.create(name=secret_team_name, project=project_acc2, manager=han_solo)

        context = {"org_unit_type_id": self.org_unit_type_region.id, "team_names": secret_team_name}

        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures",
            fixture_name="test_user_bulk_create_valid_with_multiple_teams.csv",
            context=context,
        )

        test_file = SimpleUploadedFile("test.csv", csv_content.encode("utf-8"), content_type="text/csv")

        response = self.client.post(f"{BASE_URL}", {"file": test_file}, format="multipart")

        self.assertEqual(response.status_code, 400)
        expected_error = f"Row 2: Team '{secret_team_name}' does not exist."
        self.assertEqual(response.json()["error"], expected_error)

    @patch("iaso.api.profiles.bulk_create_users.send_bulk_email_invitations")
    def test_email_invitations_sent_for_users_without_password(self, mock_send_emails):
        """Test that email invitations are sent only for users without passwords."""
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_email_no_password.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["Accounts created"], 2)

        # Verify that send_bulk_email_invitations was called
        mock_send_emails.assert_called_once()
        call_args = mock_send_emails.call_args[0]
        user_ids = call_args[0]
        self.assertEqual(len(user_ids), 2)

        # Verify users were created correctly
        invite1 = User.objects.get(username="invite1")
        invite2 = User.objects.get(username="invite2")
        self.assertFalse(invite1.has_usable_password())
        self.assertFalse(invite2.has_usable_password())
        self.assertEqual(invite1.email, "invite1@test.com")
        self.assertEqual(invite2.email, "invite2@test.com")

    @patch("iaso.api.profiles.bulk_create_users.send_bulk_email_invitations")
    def test_email_invitations_mixed_scenario_with_fixture(self, mock_send_emails):
        """Test email invitations in mixed scenario."""
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_mixed_email.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["Accounts created"], 4)

        # Verify that send_bulk_email_invitations was called
        mock_send_emails.assert_called_once()
        call_args = mock_send_emails.call_args[0]
        user_ids = call_args[0]
        self.assertEqual(len(user_ids), 2)

        # Verify user creation and email/password states
        with_password = User.objects.get(username="with_password")
        no_password1 = User.objects.get(username="no_password1")
        no_password2 = User.objects.get(username="no_password2")
        no_email = User.objects.get(username="no_email")

        self.assertTrue(with_password.has_usable_password())
        self.assertTrue(no_email.has_usable_password())

        self.assertFalse(no_password1.has_usable_password())
        self.assertFalse(no_password2.has_usable_password())

    def test_bulk_configuration_three_scenarios(self):
        """Test bulk_configuration"""
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        self.account1.modules = self.MODULES
        self.account1.save()
        self.account1.refresh_from_db()

        self.client.post("/api/userroles/", data={"name": "manager"})

        bulk_configuration = {
            "profile_language": "fr",
            "organization": "UNICEF",
            "permissions": ["iaso_forms"],
            "user_roles": ["manager"],
            "projects": [self.project.name],
            "orgunit": [self.org_unit1.id, self.org_unit2.id],
        }

        with open("iaso/tests/fixtures/test_user_bulk_create_bulk_configuration.csv") as csv_file:
            response = self.client.post(
                f"{BASE_URL}",
                {
                    "file": csv_file,
                    "bulk_configuration": json.dumps(bulk_configuration),
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["Accounts created"], 3)

        # ALL bulk_configuration applied
        all_bulk_user = User.objects.get(username="all_bulk_user")
        all_bulk_profile = all_bulk_user.iaso_profile
        self.assertEqual(all_bulk_profile.language, "fr")
        self.assertEqual(all_bulk_profile.organization, "UNICEF")  # From bulk_configuration
        self.assertIsNone(all_bulk_profile.dhis2_id)
        self.assertTrue(all_bulk_user.user_permissions.filter(codename="iaso_forms").exists())
        self.assertEqual(all_bulk_profile.user_roles.count(), 1)
        self.assertEqual(all_bulk_profile.user_roles.first().group.name, f"{self.account1.id}_manager")
        self.assertEqual(all_bulk_profile.projects.count(), 1)
        self.assertEqual(all_bulk_profile.projects.first(), self.project)
        self.assertEqual(all_bulk_profile.org_units.count(), 2)  # From bulk_configuration
        self.assertIn(self.org_unit1, all_bulk_profile.org_units.all())
        self.assertIn(self.org_unit2, all_bulk_profile.org_units.all())

        # ALL bulk_configuration ignored
        no_bulk_user = User.objects.get(username="no_bulk_user")
        no_bulk_profile = no_bulk_user.iaso_profile

        self.assertEqual(no_bulk_profile.language, "en")
        self.assertEqual(no_bulk_profile.organization, "MSF")
        self.assertEqual(no_bulk_profile.dhis2_id, "csv_dhis2_1")
        self.assertTrue(no_bulk_user.user_permissions.filter(codename="iaso_submissions").exists())
        self.assertFalse(no_bulk_user.user_permissions.filter(codename="iaso_forms").exists())
        self.assertEqual(no_bulk_profile.user_roles.count(), 1)
        self.assertEqual(no_bulk_profile.user_roles.first().group.name, f"{self.account1.id}_manager")
        self.assertEqual(no_bulk_profile.projects.count(), 1)
        self.assertEqual(no_bulk_profile.projects.first().name, "Project 2")
        self.assertEqual(no_bulk_profile.org_units.count(), 2)
        self.assertIn(self.org_unit1, no_bulk_profile.org_units.all())
        self.assertIn(self.org_unit2, no_bulk_profile.org_units.all())

        # PARTIAL bulk_configuration applied
        mixed_user = User.objects.get(username="mixed_user")
        mixed_profile = mixed_user.iaso_profile
        self.assertEqual(mixed_profile.language, "en")
        self.assertEqual(mixed_profile.organization, "WHO")
        self.assertIsNone(mixed_profile.dhis2_id)
        self.assertTrue(mixed_user.user_permissions.filter(codename="iaso_forms").exists())
        self.assertFalse(mixed_user.user_permissions.filter(codename="iaso_submissions").exists())
        self.assertEqual(mixed_profile.user_roles.count(), 1)
        self.assertEqual(mixed_profile.user_roles.first().group.name, f"{self.account1.id}_manager")
        self.assertEqual(mixed_profile.projects.count(), 1)
        self.assertEqual(mixed_profile.projects.first(), self.project)
        self.assertEqual(mixed_profile.org_units.count(), 2)
        self.assertIn(self.org_unit1, mixed_profile.org_units.all())
        self.assertIn(self.org_unit2, mixed_profile.org_units.all())
