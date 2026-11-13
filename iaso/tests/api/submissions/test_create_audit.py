import hashlib
import json

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsCreateAuditTestCase(SubmissionsTestCase):
    """Every request kept in an `APIImport`, refused or not."""

    def assertAudit(self, data, *, has_problem, json_body):
        api_import = APIImport.objects.get()
        self.assertEqual(data["import_id"], api_import.id)
        self.assertEqual(
            (api_import.user, api_import.import_type, api_import.has_problem, api_import.app_id),
            (self.user, "submissionsJson", has_problem, self.project.app_id),
        )
        self.assertEqual(api_import.json_body, json_body)
        self.assertEqual(api_import.headers["REMOTE_ADDR"], "127.0.0.1")
        return api_import

    def test_created(self):
        submission = self.submission()

        data = self.assertJSONResponse(self.post(submission), status.HTTP_201_CREATED)

        api_import = self.assertAudit(data, has_problem=False, json_body={"submissions": [submission]})
        self.assertEqual(api_import.exception, "")
        self.assertEqual(m.Instance.objects.get().api_import, api_import)

    def test_refused_kept_with_its_errors(self):
        submission = self.submission(content={"population": -1})

        data = self.assertJSONResponse(self.post(submission), status.HTTP_400_BAD_REQUEST)

        api_import = self.assertAudit(data, has_problem=True, json_body={"submissions": [submission]})
        self.assertEqual(json.loads(api_import.exception), {"results": data["results"]})
        self.assertEqual(data["results"][0]["errors"][0]["code"], "CONSTRAINT")
        self.assertFalse(m.Instance.objects.exists())

    def test_a_malformed_request_is_kept_too(self):
        data = self.assertJSONResponse(
            self.client.post(URL, {"submissions": []}, format="json"), status.HTTP_400_BAD_REQUEST
        )

        api_import = self.assertAudit(data, has_problem=True, json_body={"submissions": []})
        self.assertIn("submissions", json.loads(api_import.exception))

    def test_dry_run_kept_without_problem(self):
        data = self.assertJSONResponse(self.post(self.submission(), query="?dry_run=true"), status.HTTP_200_OK)

        self.assertAudit(data, has_problem=False, json_body={"submissions": [self.submission()]})
        self.assertFalse(m.Instance.objects.exists())

    def test_files_described_not_kept(self):
        content = b"\xff\xd8\xff photo"
        submission = self.submission(content={"photo": "front.jpg"})
        response = self.client.post(
            URL,
            {
                "payload": json.dumps({"submissions": [submission]}),
                "front.jpg": SimpleUploadedFile("front.jpg", content, content_type="image/jpeg"),
            },
            format="multipart",
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        api_import = self.assertAudit(
            data,
            has_problem=False,
            json_body={
                "submissions": [submission],
                "attachments": [
                    {
                        "name": "front.jpg",
                        "size": len(content),
                        "content_type": "image/jpeg",
                        "sha256": hashlib.sha256(content).hexdigest(),
                    }
                ],
            },
        )
        self.assertFalse(api_import.file)
        # the file itself still saved whole, after being hashed
        self.assertEqual(m.InstanceFile.objects.get().file.read(), content)

    def test_app_id_of_the_submissions_project(self):
        # the user's first project isn't the form's: the row must still be listed with the form's project
        malaria = m.Project.objects.create(name="Belgium malaria", app_id="be.malaria", account=self.account)
        self.form.projects.set([malaria])
        self.district.projects.add(malaria)

        data = self.assertJSONResponse(self.post(self.submission()), status.HTTP_201_CREATED)

        self.assertEqual(APIImport.objects.get(id=data["import_id"]).app_id, "be.malaria")
