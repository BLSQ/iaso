from django.core.files.uploadedfile import SimpleUploadedFile

from hat.api_import.models import APIImport, api_import_upload_to
from iaso.models import Account, FeatureFlag, Project, Task
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
        cls.require_authentication = FeatureFlag.objects.get(code=FeatureFlag.REQUIRE_AUTHENTICATION)

    def test_success_authenticated(self):
        self.client.force_authenticate(self.user)

        self.assertEqual(APIImport.objects.count(), 0)

        file_name = "file.zip"
        response = self.client.post(
            f"{BASE_URL}?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile(file_name, b"Some file content")},
            format="multipart",
        )
        self.assertJSONResponse(response, 204)

        self.assertEqual(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEqual(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)
        self.assertIsNotNone(api_import.file)

        expected_file_name = api_import_upload_to(api_import, file_name)
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_success_unauthenticated(self):
        self.assertFalse(self.project.has_feature(FeatureFlag.REQUIRE_AUTHENTICATION))

        self.assertEqual(APIImport.objects.count(), 0)
        self.assertEqual(Task.objects.count(), 0)

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

        task = Task.objects.last()
        self.assertEqual(task.created_by, None)
        self.assertEqual(task.launcher, None)
        self.assertEqual(task.account, self.account)
        self.assertEqual(task.name, "process_mobile_bulk_upload")

    def test_fail_unauthenticated(self):
        """
        If the project has the feature flag "REQUIRE_AUTHENTICATION" set to `True`,
        authentication should be required.
        """
        self.project.feature_flags.add(self.require_authentication)

        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 401)

    def test_fail_no_zip_file(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(f"{BASE_URL}?app_id={APP_ID}")
        self.assertJSONResponse(response, 400)
        self.assertEqual(response.json(), {"zip_file": ["No file was submitted."]})
