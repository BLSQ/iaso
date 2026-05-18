import io

from io import BytesIO
from unittest import mock

import pandas as pd

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from iaso.test import APITestCase
from iaso.tests.api.bulk_create_users.test_views.common import BASE_URL, BulkCreateAPITestCase


class BulkCreateFromXlsxTestCase(BulkCreateAPITestCase, APITestCase):
    _file_extension = "xlsx"

    def setUp(self):
        super().setUp()

        patcher = mock.patch(
            "magic.from_buffer", return_value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        self.mock_from_buffer = patcher.start()
        self.addCleanup(patcher.stop)

    def create_from_fixture(self, fixture_name, context):
        csv_content = self.load_fixture_with_jinja_template(
            path_to_fixtures="iaso/tests/fixtures/bulk_create_users",
            fixture_name=f"{fixture_name}.csv",
            context=context,
        )

        df = pd.read_csv(io.StringIO(csv_content), dtype=str)

        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)

        return excel_buffer.getvalue()

    def read_content_from_fixture_file(self, fixture_name):
        file_content = super().read_content_from_fixture_file(fixture_name)
        df = pd.read_csv(io.StringIO(file_content), dtype=str)

        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)

        return excel_buffer.getvalue()

    def generate_simple_uploaded_file(self, file_name, file_content):
        return SimpleUploadedFile(
            f"{file_name}.xlsx",
            file_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    def get_rows_from_file(self, file):
        df = pd.read_excel(file, dtype=str)
        yield from df.to_dict(orient="records")

    def test_file_from_sample_does_not_trigger_invalid_file_type(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(reverse("bulkcreateuser-download-sample-xlsx"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        file_content = b"".join(response.streaming_content)

        uploaded_file = SimpleUploadedFile(name="test.xlsx", content=file_content)

        response = self.client.post(f"{BASE_URL}", {"file": uploaded_file}, format="multipart")

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("file", res_data)
