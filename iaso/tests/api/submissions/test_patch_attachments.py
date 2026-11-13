import json

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli


def jpeg(name):
    return SimpleUploadedFile(name, b"\xff\xd8\xff" + name.encode(), content_type="image/jpeg")


@requires_odk_cli
class SubmissionsPatchAttachmentsTestCase(SubmissionsTestCase):
    def setUp(self):
        super().setUp()
        self.instance = self.create()

    def patch_multipart(self, body, files, query=""):
        return self.client.patch(
            f"{URL}{self.instance.id}/{query}", {"payload": json.dumps(body), **files}, format="multipart"
        )

    def files(self):
        return sorted(self.instance.instancefile_set.values_list("name", "file"))

    def assertRefused(self, response, expected_errors):
        files_before = self.files()
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(error["code"], error["field"]) for error in data["errors"]], expected_errors)
        self.assertEqual(self.files(), files_before, "no file attached")
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.json["photo"], "")

    def test_a_new_photo(self):
        # the part named as the answer, the file's own name another
        response = self.patch_multipart({"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("IMG_0002.jpg")})

        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "SubmissionPatchResult")
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.json["photo"], "front.jpg")
        attachment = self.instance.instancefile_set.get()
        self.assertEqual(attachment.name, "front.jpg")
        self.assertEqual(attachment.file.read(), b"\xff\xd8\xffIMG_0002.jpg")
        self.assertEqual(
            APIImport.objects.get(id=data["import_id"]).json_body["attachments"][0]["name"], "front.jpg", "audited"
        )

    def test_a_file_the_submission_has(self):
        self.assertJSONResponse(
            self.patch_multipart({"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("front.jpg")}),
            status.HTTP_200_OK,
        )
        files = self.files()
        read = self.assertJSONResponse(self.client.get(f"{URL}{self.instance.id}/"), status.HTTP_200_OK)

        # sent back as read, as JSON
        data = self.assertJSONResponse(
            self.client.patch(
                f"{URL}{self.instance.id}/", {"content": {**read["content"], "head_name": "Alicia"}}, format="json"
            ),
            status.HTTP_200_OK,
        )

        self.assertEqual(data["submission"]["content"]["photo"], "front.jpg")
        self.assertEqual(self.files(), files, "no file added")

        # another file under that name: which one would it mean?
        response = self.patch_multipart({"content": {"population": 4}}, {"front.jpg": jpeg("front.jpg")})
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(e["code"], e["field"]) for e in data["errors"]], [("INVALID", "front.jpg")])
        response = self.patch_multipart({"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("front.jpg")})
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(e["code"], e["field"]) for e in data["errors"]], [("CONFLICT", "content.photo")])
        self.assertEqual(self.files(), files)

    def test_a_deleted_file_name_can_be_used_again(self):
        self.assertJSONResponse(
            self.patch_multipart({"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("front.jpg")}),
            status.HTTP_200_OK,
        )
        self.instance.instancefile_set.update(deleted=True)

        self.assertJSONResponse(
            self.patch_multipart({"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("new.jpg")}),
            status.HTTP_200_OK,
        )

        self.assertEqual(self.instance.instancefile_set.filter(deleted=False).get().file.read(), b"\xff\xd8\xffnew.jpg")

    def test_refused(self):
        self.assertRefused(
            self.patch_multipart({"content": {"photo": "front.jpg"}}, {}), [("MISSING_ATTACHMENT", "content.photo")]
        )
        # a file no answer names
        self.assertRefused(
            self.patch_multipart({"content": {"population": 4}}, {"front.jpg": jpeg("front.jpg")}),
            [("INVALID", "front.jpg")],
        )
        self.assertRefused(
            self.patch_multipart({"period": "202612"}, {"front.jpg": jpeg("front.jpg")}), [("INVALID", "front.jpg")]
        )
        # the submission refused: its file isn't attached
        self.assertRefused(
            self.patch_multipart({"content": {"photo": "front.jpg", "population": -1}}, {"front.jpg": jpeg("a.jpg")}),
            [("CONSTRAINT", "content.population")],
        )

    def test_dry_run_attaches_nothing(self):
        response = self.patch_multipart(
            {"content": {"photo": "front.jpg"}}, {"front.jpg": jpeg("front.jpg")}, query="?dry_run=true"
        )

        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["submission"]["content"]["photo"], "front.jpg")
        self.assertFalse(m.InstanceFile.objects.exists())
