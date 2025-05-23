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

    def test_success(self):
        self.client.force_authenticate(self.user)

        self.assertEqual(APIImport.objects.count(), 0)

        response = self.client.post(
            f"{BASE_URL}?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile("file.zip", b"Some file content")},
            format="multipart",
        )
        self.assertJSONResponse(response, 204)

        self.assertEqual(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEqual(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)
        self.assertIsNotNone(api_import.file)

    def test_fail_unauthenticated(self):
        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 401)

    def test_fail_no_zip_file(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 400)
        self.assertEqual(response.json(), {"zip_file": ["No file was submitted."]})
