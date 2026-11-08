import json

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from iaso import models as m
from iaso.tests.api.submissions.fixtures import URL, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsCreateAttachmentsTestCase(SubmissionsTestCase):
    def post_multipart(self, submissions, files, query=""):
        return self.client.post(
            f"{URL}{query}",
            {"payload": json.dumps({"submissions": submissions}), **files},
            format="multipart",
        )

    @staticmethod
    def jpeg(name):
        return SimpleUploadedFile(name, b"\xff\xd8\xff" + name.encode(), content_type="image/jpeg")

    def assertNothingSaved(self):
        self.assertFalse(m.Instance.objects.exists())
        self.assertFalse(m.InstanceFile.objects.exists())

    def test_a_binary_answer_names_its_file(self):
        response = self.post_multipart(
            [self.submission(content={"photo": "front.jpg"})], {"front.jpg": self.jpeg("front.jpg")}
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        instance = m.Instance.objects.get()
        self.assertEqual(instance.json["photo"], "front.jpg")
        attachment = m.InstanceFile.objects.get()
        self.assertEqual((attachment.instance, attachment.name), (instance, "front.jpg"))
        self.assertEqual(attachment.file.read(), b"\xff\xd8\xfffront.jpg")

    def test_files_of_several_submissions(self):
        response = self.post_multipart(
            [
                self.submission(content={"photo": "a.jpg"}),
                self.submission(ref="row-2", content={"photo": "b.jpg"}),
            ],
            {"a.jpg": self.jpeg("a.jpg"), "b.jpg": self.jpeg("b.jpg")},
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        files_by_instance = dict(m.InstanceFile.objects.values_list("instance_id", "name"))
        self.assertEqual(files_by_instance, {data["results"][0]["id"]: "a.jpg", data["results"][1]["id"]: "b.jpg"})

    def test_a_missing_file(self):
        response = self.post_multipart([self.submission(content={"photo": "front.jpg"})], {})

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            data["results"][0]["errors"],
            [
                {
                    "code": "MISSING_ATTACHMENT",
                    "field": "content.photo",
                    "message": "No file of this name in the request",
                    "answer": "front.jpg",
                }
            ],
        )
        self.assertNothingSaved()

    def test_a_file_no_answer_names(self):
        response = self.post_multipart(
            [self.submission(content={"photo": "front.jpg"})],
            {"front.jpg": self.jpeg("front.jpg"), "back.jpg": self.jpeg("back.jpg")},
        )

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIsInstance(data.pop("import_id"), int)
        self.assertEqual(data, {"back.jpg": ["Not the answer of any submission"]})
        self.assertNothingSaved()

    def test_a_file_used_twice(self):
        response = self.post_multipart(
            [self.submission(content={"photo": "a.jpg"}), self.submission(ref="row-2", content={"photo": "a.jpg"})],
            {"a.jpg": self.jpeg("a.jpg")},
        )

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            [(e["code"], e["field"]) for e in data["results"][1]["errors"]], [("INVALID", "content.photo")]
        )
        self.assertNothingSaved()

    def test_dry_run_stores_no_file(self):
        response = self.post_multipart(
            [self.submission(content={"photo": "front.jpg"})], {"front.jpg": self.jpeg("front.jpg")}, "?dry_run=true"
        )

        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertNothingSaved()

    def test_payload_must_be_json(self):
        response = self.client.post(URL, {"payload": "{nope"}, format="multipart")

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("payload", data)
