from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile

from hat.api_import.models import APIImport
from iaso.models import Account, Project
from iaso.test import APITestCase


BASE_URL = "/api/mobile/bulkupload/"
APP_ID = "org.bluesquare.rdc"


class MobileBulkUploadsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="RDC")
        cls.project = Project.objects.create(
            name="RDCCampaign",
            app_id=APP_ID,
            account=cls.account,
        )
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    @mock.patch("boto3.client")
    def test_success(self, mock_s3_client):
        self.client.force_authenticate(self.user)

        s3_client_mock = mock.MagicMock()
        mock_s3_client.return_value = s3_client_mock
        s3_client_mock.upload_file.return_value = None

        self.assertEqual(APIImport.objects.count(), 0)

        response = self.client.post(
            f"{BASE_URL}?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile("file.zip", b"Some file content")},
            format="multipart",
        )
        self.assertJSONResponse(response, 204)

        s3_client_mock.upload_file.assert_called_once()
        self.assertEqual(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEqual(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)

    def test_fail_unauthenticated(self):
        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 401)

    def test_fail_no_zip_file(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 400)
        self.assertEqual(response.json(), {"zip_file": ["No file was submitted."]})

    @mock.patch("boto3.client")
    def test_fail_s3_upload(self, mock_s3_client):
        self.client.force_authenticate(self.user)

        s3_client_mock = mock.MagicMock()
        mock_s3_client.return_value = s3_client_mock
        s3_client_mock.upload_file.side_effect = Exception("An error occurred")

        self.assertEqual(APIImport.objects.count(), 0)

        response = self.client.post(
            f"{BASE_URL}?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile("file.zip", b"Some file content")},
            format="multipart",
        )
        self.assertJSONResponse(response, 500)

        s3_client_mock.upload_file.assert_called_once()
        self.assertEqual(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEqual(api_import.import_type, "bulk")
        self.assertTrue(api_import.has_problem)
        self.assertIsNotNone(api_import.exception)
