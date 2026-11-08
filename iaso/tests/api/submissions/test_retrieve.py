import uuid

from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.api.submissions.fixtures import URL, VERSION, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsRetrieveTestCase(SubmissionsTestCase):
    def create(self, **overrides) -> m.Instance:
        data = self.assertJSONResponse(self.post(self.submission(**overrides)), status.HTTP_201_CREATED)
        return m.Instance.objects.get(id=data["results"][0]["id"])

    def test_the_shape_post_takes(self):
        instance = self.create(
            uuid=str(uuid.uuid4()),
            location={"latitude": 51.2, "longitude": 4.4, "altitude": 10, "accuracy": 5},
            source_created_at="2026-11-01T08:00:00Z",
            content={"child": [{"child_name": "Bob"}]},
        )

        data = self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_200_OK)

        self.assertResponseCompliantToSwagger(data, "Submission")
        self.assertEqual(data.pop("updated_at"), instance.updated_at.isoformat().replace("+00:00", "Z"))
        self.assertEqual(
            data,
            {
                "id": instance.id,
                "uuid": instance.uuid,
                "form_id": self.form.id,
                "project_id": self.project.id,
                "org_unit_id": self.antwerp.id,
                "period": "202611",
                "source_created_at": "2026-11-01T08:00:00Z",
                "location": {"latitude": 51.2, "longitude": 4.4, "altitude": 10.0, "accuracy": "5.00"},
                "deleted": False,
                "content": instance.json,
            },
        )
        self.assertEqual(data["content"]["_version"], VERSION)
        self.assertEqual(data["content"]["head_name"], "Alice")

    def test_read_then_sent_back_is_unchanged(self):
        instance = self.create(content={"child": [{"child_name": "Bob", "child_age": 2}]})
        read = self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_200_OK)

        sent = {key: read[key] for key in ("uuid", "form_id", "project_id", "org_unit_id", "period", "content")}
        data = self.assertJSONResponse(self.post({"ref": "again", **sent}), status.HTTP_201_CREATED)

        self.assertEqual(data["results"][0]["status"], "unchanged")
        self.assertEqual(data["results"][0]["id"], instance.id)
        self.assertEqual(m.Instance.objects.count(), 1)

    def test_without_location(self):
        instance = self.create()

        data = self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_200_OK)

        self.assertIsNone(data["location"])
        self.assertResponseCompliantToSwagger(data, "Submission")

    def test_only_the_submissions_the_user_can_see(self):
        instance = self.create()
        french = self.create_form_instance(form=self.france_form, project=self.france_project, json={"a": "1"})
        brussels_only = self.create_user_with_profile(
            username="brussels_reader",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_PERMISSION],
            org_units=[self.brussels],
        )
        half_uploaded = self.create_form_instance(form=self.form, project=self.project, org_unit=self.antwerp)

        self.assertJSONResponse(self.client.get(f"{URL}{french.id}/"), status.HTTP_404_NOT_FOUND)
        self.assertJSONResponse(self.client.get(f"{URL}{half_uploaded.id}/"), status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(brussels_only)
        self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_404_NOT_FOUND)

    def test_permissions(self):
        instance = self.create()
        reader = self.create_user_with_profile(
            username="belgium_reader", account=self.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        nobody = self.create_user_with_profile(username="belgium_nobody", account=self.account)

        self.client.force_authenticate(reader)
        self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_200_OK)
        self.client.force_authenticate(nobody)
        self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(None)
        self.assertJSONResponse(self.client.get(f"{URL}{instance.id}/"), status.HTTP_401_UNAUTHORIZED)
