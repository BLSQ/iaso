import csv
import io

from unittest import mock

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.models import Profile
from iaso.test import APITestCase
from iaso.tests.api.bulk_create_users.test_views.common import BulkCreateAPITestCase


BASE_URL = "/api/bulkcreateuser/"


class BulkCreateFromCsvTestCase(BulkCreateAPITestCase, APITestCase):
    _file_extension = "csv"

    def setUp(self):
        super().setUp()

        patcher = mock.patch("magic.from_buffer", return_value="text/csv")
        self.mock_from_buffer = patcher.start()
        self.addCleanup(patcher.stop)

    def create_from_fixture(self, fixture_name, context):
        return self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures/bulk_create_users",
            fixture_name=f"{fixture_name}.csv",
            context=context,
        )

    def generate_simple_uploaded_file(self, file_name, file_content):
        return SimpleUploadedFile(f"{file_name}.csv", file_content.encode("utf-8"), content_type="text/csv")

    def get_rows_from_file(self, file):
        csv_content = io.StringIO(file.read().decode("utf-8"))
        reader = csv.DictReader(csv_content)

        yield from reader

    def test_upload_semicolon_separated_csv(self):
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])

        file = self.generate_file_from_fixture("test_user_bulk_create_semicolon", with_context=False)

        response = self.client.post(f"{BASE_URL}", {"file": file}, format="multipart")

        users = User.objects.all()
        profiles = Profile.objects.all()

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
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

    def test_upload_file_with_users_export_extra_columns(self):
        """A file shaped like the users export (extra `user_profile_id` and `last_login_at` columns) can be imported."""
        self.client.force_authenticate(self.yoda)
        self.source.projects.set([self.project])
        csv_content = io.StringIO()
        writer = csv.DictWriter(csv_content, ["user_profile_id"] + BULK_CREATE_USER_COLUMNS_LIST + ["last_login_at"])
        writer.writeheader()
        writer.writerow(
            {
                "user_profile_id": 123,
                "username": "belgium",
                "password": "yodnj!30dln",
                "email": "belgium@bluesquarehub.com",
                "orgunit": self.org_unit1.pk,
                "last_login_at": "2026-11-16T09:30:15+00:00",
            }
        )
        uploaded_file = SimpleUploadedFile("users.csv", csv_content.getvalue().encode("utf-8"), content_type="text/csv")

        response = self.client.post(f"{BASE_URL}", {"file": uploaded_file}, format="multipart")

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        new_user = User.objects.get(username="belgium")
        self.assertEqual(new_user.email, "belgium@bluesquarehub.com")
        self.assertIsNone(new_user.last_login, "last_login_at is export-only and must not be imported")
        self.assertQuerySetEqual(new_user.iaso_profile.org_units.all(), [self.org_unit1])

    def test_file_from_sample_does_not_trigger_invalid_file_type(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(reverse("bulkcreateuser-download-sample-csv"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

        csv_content = b"".join(response.streaming_content)

        uploaded_file = SimpleUploadedFile(name="test.csv", content=csv_content)

        response = self.client.post(f"{BASE_URL}", {"file": uploaded_file}, format="multipart")

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("file", res_data)
