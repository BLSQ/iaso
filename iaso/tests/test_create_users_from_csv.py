import csv

from django.contrib.auth.models import User, Permission, Group

from iaso import models as m
from iaso.models import Profile, BulkCreateUserCsvFile
from iaso.test import APITestCase

BASE_URL = "/api/bulkcreateuser/"


class BulkCreateCsvTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        manager_group = Group.objects.create(name="manager")
        area_manager_group = Group.objects.create(name="area_manager")

        cls.manager_role = m.UserRole.objects.create(group=manager_group, account=star_wars)
        cls.area_manager_group = m.UserRole.objects.create(group=area_manager_group, account=star_wars)

        space_balls = m.Account.objects.create(name="Space Balls")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        st_version = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.han_solo = cls.create_user_with_profile(
            username="han solo", account=space_balls, permissions=["iaso_submissions", "iaso_users"]
        )

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_submissions", "iaso_users"]
        )

        cls.obi = cls.create_user_with_profile(username="obi", account=star_wars)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Coruscant Jedi Council", version=sw_version)

        cls.tatooine = m.OrgUnit.objects.create(name="Tatooine", version=sw_version)

        cls.dagobah = m.OrgUnit.objects.create(name="Dagobah", id=9999, version=sw_version)

        cls.solana = m.OrgUnit.objects.create(name="Solana", version=sw_version)
        cls.solanaa = m.OrgUnit.objects.create(name="Solana", version=sw_version)

        cls.chiloe = m.OrgUnit.objects.create(name="chiloe", id=10244, version=sw_version, parent=cls.tatooine)
        cls.chiloe = m.OrgUnit.objects.create(name="chiloe", id=10934, version=st_version)

        cls.yoda.iaso_profile.org_units.set([cls.jedi_council_corruscant, cls.tatooine, cls.dagobah, cls.solana])

    def test_upload_valid_csv(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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

        iaso_forms = Permission.objects.get(codename="iaso_forms")
        iaso_submissions = Permission.objects.get(codename="iaso_submissions")

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
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_mail.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Operation aborted. Invalid Email at row : 3. Fix the error and try again."
        )

    def test_upload_without_mail_must_work(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_no_mail.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["Accounts created"], 3)

    def test_upload_invalid_orgunit_id(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit 99998 at row : 2. Fix the error " "and try again.",
        )

    def test_upload_user_already_exists(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

        response = self.client.get(f"{BASE_URL}")

        self.assertEqual(response.status_code, 403)

    def test_password_delete_after_import(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_password.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Error at row 4. This password is too short. It must contain at least 8 characters.",
        )

    def test_created_users_can_login(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"{BASE_URL}", {"file": csv_users})

        self.assertEqual(response.status_code, 200)

        login_data = {"username": "broly", "password": "yodnj!30dln"}

        login_response = self.client.post("/api/token/", data=login_data, format="json")

        self.assertEqual(login_response.status_code, 200)

    def test_upload_invalid_orgunit_name(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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

    # FIXME This test is flaky
    def test_users_profiles_have_right_ou(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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
        self.assertCountEqual(ou_f_list, [self.jedi_council_corruscant.id, self.tatooine.id, 9999])
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
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

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

        print("DATA: ", response.data)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "Something is wrong with your CSV File. Possibly missing {'permissions'} column(s)."},
        )

    def test_create_user_with_roles(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

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
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid_with_projects.csv") as csv_users:
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
        self.assertEqual(len(new_user_1.iaso_profile.projects.all()), 1)
        self.assertEqual(new_user_1.iaso_profile.projects.all()[0].name, "Hydroponic gardens")
        self.assertEqual(new_user_2.iaso_profile.projects.all()[0].name, "Hydroponic gardens")
        self.assertEqual(response.data, {"Accounts created": 2})
