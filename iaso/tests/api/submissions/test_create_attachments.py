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
        # the part named as the answer, the file's own name (from the phone) another
        response = self.post_multipart(
            [self.submission(content={"photo": "front.jpg"})], {"front.jpg": self.jpeg("IMG_0001.jpg")}
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        instance = m.Instance.objects.get()
        self.assertEqual(instance.json["photo"], "front.jpg")
        attachment = m.InstanceFile.objects.get()
        self.assertEqual((attachment.instance, attachment.name), (instance, "front.jpg"))
        self.assertEqual(attachment.file.read(), b"\xff\xd8\xffIMG_0001.jpg")

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

    def test_the_same_file_name_in_several_submissions(self):
        submissions = [
            self.submission(ref=ref, org_unit_id=org_unit.id, content={"photo": "photo.jpg"})
            for ref, org_unit in (("row-1", self.antwerp), ("row-2", self.brussels), ("row-3", self.antwerp))
        ]
        # a part per submission; the last one alone with this name, its part needs no ref
        files = {
            "row-1/photo.jpg": self.jpeg("antwerp.jpg"),
            "row-2/photo.jpg": self.jpeg("brussels.jpg"),
            "photo.jpg": self.jpeg("antwerp_again.jpg"),
        }

        data = self.assertJSONResponse(self.post_multipart(submissions, files), status.HTTP_201_CREATED)

        attached = {
            attachment.instance_id: (attachment.name, attachment.file.read())
            for attachment in m.InstanceFile.objects.all()
        }
        self.assertEqual(
            [attached[result["id"]] for result in data["results"]],
            [
                ("photo.jpg", b"\xff\xd8\xffantwerp.jpg"),
                ("photo.jpg", b"\xff\xd8\xffbrussels.jpg"),
                ("photo.jpg", b"\xff\xd8\xffantwerp_again.jpg"),
            ],
        )
        self.assertEqual(m.Instance.objects.get(id=data["results"][1]["id"]).json["photo"], "photo.jpg")

    def test_a_missing_file(self):
        response = self.post_multipart([self.submission(content={"photo": "front.jpg"})], {})

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            data["results"][0]["errors"],
            [
                {
                    "code": "MISSING_ATTACHMENT",
                    "field": "content.photo",
                    "message": "No file of this name in the request: a part named row-1/front.jpg or front.jpg",
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

        # the part of another submission's ref
        response = self.post_multipart(
            [self.submission(content={"photo": "front.jpg"})],
            {"front.jpg": self.jpeg("front.jpg"), "row-2/front.jpg": self.jpeg("front.jpg")},
        )
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["row-2/front.jpg"], ["Not the answer of any submission"])
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
