import os
import zipfile

from django.test import TestCase
from unittest import mock

from django.contrib.auth.models import User
from iaso.models import Account, Project, Task, ERRORED, SUCCESS
from iaso.tasks.export_mobile_app_setup_for_user import export_mobile_app_setup_for_user
from iaso.utils.encryption import decrypt_file


def mocked_iaso_client_get(*args, **kwargs):
    url = args[0]
    if url.startswith("/api/apps/current/"):
        return {
            "id": "org.bluesquare.trypelim",
            "name": "Trypelim",
            "app_id": "org.bluesquare.trypelim",
            "feature_flags": [{"name": "Mobile: Show entities screen)", "code": "ENTITY"}],
            "needs_authentication": True,
        }
    elif url.startswith("/api/formversions/"):
        return {"form_versions": []}
    elif url.startswith("/api/formattachments/"):
        return {"results": []}
    else:
        print(args)
        # for all other calls, return an empty array
        return []


def _get_files_in_zipfile(zip_path, zip_name):
    decrypted_file_path = decrypt_file(
        file_path=zip_path,
        file_name_in=zip_name,
        file_name_out="decrypted.zip",
        password="supersecret",
    )
    with zipfile.ZipFile(decrypted_file_path, "r") as zip_ref:
        return zip_ref.namelist()


class ExportMobileAppSetupForUserTest(TestCase):
    fixtures = ["user.yaml"]

    def setUp(self):
        self.user = User.objects.first()
        self.project = Project.objects.first()
        self.task = Task.objects.create(
            name="export_mobile_app_setup",
            launcher=self.user,
            account=Account.objects.first(),
        )

    @mock.patch("iaso.tasks.export_mobile_app_setup_for_user.IasoClient")
    @mock.patch("boto3.client")
    def test_export(self, mock_s3_client, MockIasoClient):
        iaso_client_mock = mock.MagicMock()
        iaso_client_mock.get.side_effect = mocked_iaso_client_get
        MockIasoClient.return_value = iaso_client_mock

        s3_client_mock = mock.MagicMock()
        s3_client_mock.upload_file.return_value = None
        mock_s3_client.return_value = s3_client_mock

        export_mobile_app_setup_for_user(
            user_id=self.user.id,
            project_id=self.project.id,
            password="supersecret",
            task=self.task,
            _immediate=True,
        )

        s3_client_mock.upload_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, SUCCESS)
        self.assertIn("file:export-files/mobile-app-export-", self.task.result["data"])

        # check zip file contents
        zip_name = self.task.result["data"].replace("file:export-files/", "")
        folder_name = zip_name.replace(".zip", "")
        zip_path = os.path.join("/tmp", folder_name)
        # breakpoint()
        created_files = _get_files_in_zipfile(zip_path, zip_name)
        self.assertIn("app.json", created_files)
        self.assertIn("entities-1.json", created_files)
        self.assertIn("entitytypes-1.json", created_files)
        self.assertIn("formattachments.json", created_files)
        self.assertIn("forms.json", created_files)
        self.assertIn("formversions.json", created_files)
        self.assertIn("groups.json", created_files)
        self.assertIn("orgunits-1.json", created_files)
        self.assertIn("orgunittypes.json", created_files)
        self.assertIn("storage-blacklisted.json", created_files)
        self.assertIn("storage-passwords.json", created_files)
        self.assertIn("workflows.json", created_files)
