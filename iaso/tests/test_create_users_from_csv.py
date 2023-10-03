import io
import csv

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User, Permission

from iaso import models as m
from iaso.models import Profile, BulkCreateUserCsvFile, Module, Permission as iaso_permission
from iaso.test import APITestCase

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
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = m.DataSource.objects.create(name="Source")
        version1 = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        version2 = m.SourceVersion.objects.create(data_source=cls.source, number=2)

        account1 = m.Account.objects.create(name="Account 1")
        cls.project = m.Project.objects.create(name="Project name", app_id="project.id", account=account1)
        account1.default_version = version1
        account1.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=account1, permissions=["iaso_submissions", "iaso_users", "iaso_user_roles"]
        )
        cls.obi = cls.create_user_with_profile(username="obi", account=account1)

        cls.org_unit1 = m.OrgUnit.objects.create(name="Coruscant Jedi Council", version=version1, source_ref="foo")
        cls.org_unit2 = m.OrgUnit.objects.create(name="Tatooine", version=version1, source_ref="bar")
        cls.org_unit3 = m.OrgUnit.objects.create(name="Dagobah", id=9999, version=version1, source_ref="baz")
        cls.org_unit4 = m.OrgUnit.objects.create(name="Solana", version=version1)

        cls.yoda.iaso_profile.org_units.set([cls.org_unit1, cls.org_unit2, cls.org_unit3, cls.org_unit4])

        m.OrgUnit.objects.create(name="chiloe", id=10244, version=version1, parent=cls.org_unit2)
        m.OrgUnit.objects.create(name="chiloe", id=10934, version=version2)

        account2 = m.Account.objects.create(name="Account 2")
        cls.create_user_with_profile(
            username="han solo", account=account2, permissions=["iaso_submissions", "iaso_users"]
        )

        cls.version1 = version1
        cls.version2 = version2
        cls.account1 = account1

    def test_upload_valid_csv(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 6)
        self.assertEqual(len(profiles), 6)
        new_user_1 = users.get(username="broly")
        org_unit_ids = [org_unit.id for org_unit in list(new_user_1.iaso_profile.org_units.all())]
        self.assertEqual(new_user_1.email, "biobroly@bluesquarehub.com")
        self.assertEqual(new_user_1.first_name, "broly")
        self.assertEqual(new_user_1.last_name, "bio")
        self.assertEqual(new_user_1.iaso_profile.language, "fr")
        self.assertEqual(new_user_1.iaso_profile.dhis2_id, "dhis2_id_1")
        self.assertEqual(org_unit_ids, [9999])

    def test_upload_valid_csv_with_perms(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])
        module = Module.objects.create(name="module name", codename="MODULE_NAME")

        iaso_forms = Permission.objects.get(codename="iaso_forms")
        iaso_submissions = Permission.objects.get(codename="iaso_submissions")

        iaso_permission.objects.create(module=module, permission=iaso_forms)
        iaso_permission.objects.create(module=module, permission=iaso_submissions)

        self.star_wars.modules.set([module])
        self.star_wars.save()

        self.star_wars.refresh_from_db()

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_perm.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

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
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Operation aborted. Invalid Email at row : 3. Fix the error and try again."
        )

    def test_upload_without_mail_must_work(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_no_mail.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["Accounts created"], 3)

    def test_upload_invalid_orgunit_id(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit 99998 at row : 2. Fix the error " "and try again.",
        )

    def test_upload_user_already_exists(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        user = User.objects.create(
            username="broly", first_name="broly", last_name="Smith", email="broly-smith@bluesquarehub.com"
        )
        user.save()

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Error at row 1 Account already exists : broly. " "Fix the error and try again.",
        )

    def test_upload_invalid_csv_dont_create_entries(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit 99998 at row : 2. Fix the error " "and try again.",
        )
        self.assertEqual(len(users), 3)
        self.assertEqual(len(profiles), 3)

    def test_user_cant_access_without_permission(self):
        self.client.force_authenticate(self.obi)
        self.source.projects.set([self.project])

        response = self.client.get(f"{BASE_URL}")

        self.assertEqual(response.status_code, 403)

    def test_password_delete_after_import(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        pswd_deleted = True

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        csv_file = BulkCreateUserCsvFile.objects.last()

        file = open(csv_file.file.path, "r")
        reader = csv.reader(file)
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
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Error at row 4. This password is too short. It must contain at least 8 characters.",
        )

    def test_created_users_can_login(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 200)

        login_data = {"username": "broly", "password": "yodnj!30dln"}

        login_response = self.client.post("/api/token/", data=login_data, format="json")

        self.assertEqual(login_response.status_code, 200)

    def test_upload_invalid_orgunit_name(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_ou_name.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit Bazarre at row : 4. Fix "
            "the error "
            "and try "
            "again. Use Orgunit ID instead of name.",
        )

    def test_users_profiles_have_right_ou(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

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
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)

    def test_cant_create_user_without_ou_profile(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_creator_no_access_to_ou.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {
                "error": "Operation aborted. Invalid OrgUnit None chiloe 10244 at row : 2. You don't have access to this orgunit"
            },
        )

    def test_upload_duplicate_ou_names(self):
        # This test detects if in case there is multiple OU with same name in different sources the right OU is taken.
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_user_duplicate_ou_names.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

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
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

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
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 5)
        self.assertEqual(len(profiles), 5)
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

        self.assertEqual(response.data, {"Accounts created": 2})

    def test_upload_csv_with_missing_column(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_missing_columns.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "Something is wrong with your CSV File. Possibly missing {'permissions'} column(s)."},
        )

    def test_create_user_with_roles(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        data = {"name": "manager"}
        rep = self.client.post("/api/userroles/", data=data)

        data = {"name": "area_manager"}
        self.client.post("/api/userroles/", data=data)

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_roles.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 5)
        self.assertEqual(len(profiles), 5)
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
        self.assertEqual(len(new_user_1.iaso_profile.user_roles.all()), 1)
        self.assertEqual(len(new_user_2.iaso_profile.user_roles.all()), 2)

        self.assertEqual(response.data, {"Accounts created": 2})

    def test_create_user_with_projects(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_projects.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})
        users = User.objects.all()
        profiles = Profile.objects.all()
        profile_1 = Profile.objects.get(user__username="broly")
        profile_2 = Profile.objects.get(user__username="cyrus")

        self.assertEqual(profile_1.projects.all()[0].name, "Project name")
        self.assertEqual(profile_2.projects.all()[0].name, "Project name")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 5)
        self.assertEqual(len(profiles), 5)
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
        self.assertEqual(response.data, {"Accounts created": 2})

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
            }
        )
        csv_bytes = csv_str.getvalue().encode()
        csv_file = SimpleUploadedFile("users.csv", csv_bytes)

        response = self.client.post(f"{BASE_URL}", {"file": csv_file})
        self.assertEqual(response.status_code, 200)

        new_user = User.objects.get(email="john@foo.com")
        self.assertEqual(new_user.iaso_profile.account, self.account1)
        self.assertEqual(new_user.iaso_profile.org_units.count(), 1)
        self.assertEqual(new_user.iaso_profile.org_units.first(), org_unit_a)
        self.assertEqual(org_unit_a.version_id, self.account1.default_version_id)
