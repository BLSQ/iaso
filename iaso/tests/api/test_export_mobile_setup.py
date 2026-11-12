from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_MOBILE_APP_OFFLINE_SETUP_PERMISSION
from iaso.test import APITestCase


URL = "/api/tasks/create/exportmobilesetup/"
PASSWORD = "A-strong-password-1234"


class ExportMobileSetupAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Account")
        cls.project = m.Project.objects.create(name="Project", app_id="project.app", account=account)
        cls.user = cls.create_user_with_profile(
            username="user", account=account, permissions=[CORE_MOBILE_APP_OFFLINE_SETUP_PERMISSION]
        )

    def create_export(self, **data):
        self.client.force_authenticate(self.user)
        return self.client.post(
            URL, {"user_id": self.user.id, "project_id": self.project.id, "password": PASSWORD, **data}, format="json"
        )

    def test_options_are_passed_to_the_task(self):
        response_json = self.assertJSONResponse(
            self.create_export(options={"strip_visited_at": True}), status.HTTP_201_CREATED
        )

        task = m.Task.objects.get(id=response_json["task"]["id"])
        self.assertEqual(task.params["kwargs"]["options"], {"strip_visited_at": True})

    def test_options_are_optional(self):
        response_json = self.assertJSONResponse(self.create_export(), status.HTTP_201_CREATED)

        task = m.Task.objects.get(id=response_json["task"]["id"])
        self.assertEqual(task.params["kwargs"]["options"], {})

    def test_options_must_be_a_dict(self):
        response_json = self.assertJSONResponse(
            self.create_export(options=["strip_visited_at"]), status.HTTP_400_BAD_REQUEST
        )

        self.assertIn("options", response_json)

    def test_permission_required(self):
        user = self.create_user_with_profile(username="other", account=self.project.account)
        self.client.force_authenticate(user)

        response = self.client.post(
            URL, {"user_id": user.id, "project_id": self.project.id, "password": PASSWORD}, format="json"
        )

        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
