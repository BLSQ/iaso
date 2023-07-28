import csv

import pandas as pd
from django.contrib.auth.models import User, Permission
from django.core.files.uploadedfile import SimpleUploadedFile

from beanstalk_worker.services import TestTaskService
from iaso import models as m
from iaso.tasks.bulk_create_users import bulk_create_users_task
from iaso.models import Profile, BulkCreateUserCsvFile, Task
from iaso.test import APITestCase
from django.test import RequestFactory


class BulkCreateUsersFromCsvTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):

        star_wars = m.Account.objects.create(name="Star Wars")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        space_balls = m.Account.objects.create(name="Space Balls")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
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

    """
    As the api trigger a task, the tests will cover the function bulk_create_users_task directly
    """

    def test_create_from_valid_csv(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_valid.csv")

        existing_users_count = User.objects.all().count()

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        task = Task.objects.last()

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

        profiles = Profile.objects.filter(account=self.yoda.iaso_profile.account)
        usernames = [profile.user.username for profile in profiles]
        username_list = ["yoda", "broly", "obi", "ferdinand", "rsfg"]

        self.assertEqual(User.objects.count(), existing_users_count + 3)
        self.assertEqual(sorted(usernames), sorted(username_list))

    def test_upload_valid_csv_with_perms(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        iaso_forms = Permission.objects.get(codename="iaso_forms")
        iaso_submissions = Permission.objects.get(codename="iaso_submissions")

        file = open("iaso/tests/fixtures/test_user_bulk_create_valid_with_perm.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

        pollux = User.objects.get(username="pollux")
        pollux_perms = pollux.user_permissions.all()
        has_perms = False
        if iaso_forms and iaso_submissions in pollux_perms:
            has_perms = True

        profiles = Profile.objects.filter(account=self.yoda.iaso_profile.account)
        usernames = [profile.user.username for profile in profiles]
        username_list = ["yoda", "pollux", "obi", "ferdinand", "castor"]

        self.assertEqual(has_perms, True)
        self.assertEqual(sorted(usernames), sorted(username_list))

    def test_upload_invalid_mail_csv(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_mail.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")
        self.assertEqual(
            task.progress_message,
            "Error: Operation aborted. Invalid Email at row : 3.",
        )

    def test_upload_without_mail_must_work(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_no_mail.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

        profiles = Profile.objects.filter(account=self.yoda.iaso_profile.account)
        usernames = [profile.user.username for profile in profiles]
        username_list = ["broly", "yoda", "obi", "ferdinand", "rsfg"]

        self.assertEqual(sorted(usernames), sorted(username_list))

    def test_upload_invalid_orgunit_id(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")
        self.assertEqual(
            task.progress_message,
            "Error: Invalid OrgUnit 99998 at row : 2. Fix the error and try again.Error code: OrgUnit matching query does not exist.",
        )

    def test_upload_user_already_exists(self):

        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        user = User.objects.create(
            username="broly", first_name="broly", last_name="Smith", email="broly-smith@bluesquarehub.com"
        )
        user.save()

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")

    def test_upload_invalid_csv_dont_create_entries(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        users = User.objects.all()
        self.assertEqual(len(users), 3)

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")
        self.assertEqual(
            task.progress_message,
            "Error: Invalid OrgUnit 99998 at row : 2. Fix the error and try again.Error code: OrgUnit matching query does not exist.",
        )

        users = User.objects.all()
        self.assertEqual(len(users), 3)

    def test_user_cant_access_without_permission(self):

        self.client.force_authenticate(self.obi)
        self.sw_source.projects.set([self.project])

        response = self.client.get("/api/bulkcreateuser/")

        self.assertEqual(response.status_code, 403)

    def test_password_delete_after_import(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_valid.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()

        csv_file = BulkCreateUserCsvFile.objects.last()

        df = pd.read_csv(csv_file.file.path)

        self.assertNotIn("password", df.columns)

    def test_upload_invalid_password(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_password.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")

    def test_created_users_can_login(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_valid.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

        login_data = {"username": "broly", "password": "yodnj!30dln"}

        login_response = self.client.post("/api/token/", data=login_data, format="json")

        self.assertEqual(login_response.status_code, 200)

    def test_upload_invalid_orgunit_name(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_invalid_ou_name.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")
        self.assertEqual(
            task.progress_message, "Error: Invalid OrgUnit Bazarre at row : 4. Fix the error and try again."
        )

    def test_users_profiles_have_right_ou(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        file = open("iaso/tests/fixtures/test_user_bulk_create_valid.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

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

    def test_cant_create_user_without_access_to_ou(self):
        self.client.force_authenticate(self.yoda)

        file = open("iaso/tests/fixtures/test_user_bulk_create_duplicated_ou_name.csv")

        request = RequestFactory().post("/upload", {"file": file})

        uploaded_file = request.FILES["file"]

        file_instance = BulkCreateUserCsvFile.objects.create(
            file=uploaded_file, created_by=self.yoda, account=self.yoda.iaso_profile.account
        )

        task = bulk_create_users_task(user_id=self.yoda.id, file_id=file_instance.id, launch_task=True, user=self.yoda)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "ERRORED")
        self.assertEqual(
            task.progress_message,
            "Error: Invalid OrgUnit None Dagobah 9999 at row : 2. Fix the error and try again.Error code: Error: Invalid OrgUnit None Dagobah 9999 at row : 2.You don't have access to this orgunit",
        )

    def test_creating_bulk_create_user_task(self):
        self.client.force_authenticate(self.yoda)
        self.sw_source.projects.set([self.project])

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        self.assertEqual(response.json()["task"]["launcher"]["username"], "yoda")
        self.assertEqual(response.json()["task"]["name"], "bulk_create_users")
