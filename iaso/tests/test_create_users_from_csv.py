import csv
import uuid

from django.contrib.auth.models import User
from django.core.files import File
from unittest import mock

from iaso import models as m
from iaso.models import Profile, BulkCreateUserCsvFile
from iaso.test import APITestCase
import pandas as pd


class BulkCreateCsvTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

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

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Coruscant Jedi Council")

        cls.tatooine = m.OrgUnit.objects.create(name="Tatooine")

        cls.dagobah = m.OrgUnit.objects.create(name="Dagobah", id=9999)

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

    def test_upload_valid_csv(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(users), 6)
        self.assertEqual(len(profiles), 6)

    def test_upload_invalid_mail_csv(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_mail.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()[0], "Operation aborted. Invalid Email at row : 3. Fix the error and try again."
        )

    def test_upload_invalid_orgunit_id(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit 99998 at row : 1. Fix the error " "and try again.",
        )

    def test_upload_user_already_exists(self):

        self.client.force_authenticate(self.yoda)

        user = User.objects.create(
            username="broly", first_name="broly", last_name="Smith", email="broly-smith@bluesquarehub.com"
        )
        user.save()

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Error at row 1 Account already exists : broly. " "Fix the error and try again.",
        )

    def test_upload_invalid_csv_dont_create_entries(self):
        self.client.force_authenticate(self.yoda)

        with open("iaso/tests/fixtures/test_user_bulk_create_invalid_orgunit.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "Operation aborted. Invalid OrgUnit 99998 at row : 1. Fix the error " "and try again.",
        )
        self.assertEqual(len(users), 4)
        self.assertEqual(len(profiles), 3)

    def test_user_cant_access_without_permission(self):

        self.client.force_authenticate(self.obi)

        response = self.client.get("/api/bulkcreateuser/")

        self.assertEqual(response.status_code, 403)

    def test_password_delete_after_import(self):
        self.client.force_authenticate(self.yoda)

        pswd_deleted = True

        with open("iaso/tests/fixtures/test_user_bulk_create_valid.csv") as csv_users:
            response = self.client.post(f"/api/bulkcreateuser/", {"file": csv_users})

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
