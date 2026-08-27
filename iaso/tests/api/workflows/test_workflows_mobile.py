import jsonschema

from rest_framework import status

from iaso.tests.api.workflows.base import BaseWorkflowsAPITestCase


BASE_API = "/api/mobile/workflows/"


class WorkflowsMobileAPITestCase(BaseWorkflowsAPITestCase):
    def test_mobile_api_without_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get(BASE_API)

        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

        assert response.data == "No app_id provided"

    def test_mobile_api_with_nonexisting_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get(f"{BASE_API}?app_id=wrong_app_id")

        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

        assert response.data == "User not found in Projects for this app id or project not found"

    def test_mobile_api_with_nonaccessible_app_id(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get(f"{BASE_API}?app_id=red.adults.project")

        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

        assert response.data == "User not found in Projects for this app id or project not found"

    def test_mobile_api_ok(self):
        self.client.force_authenticate(self.blue_adult_1)

        set_tl_schema = {
            "type": "object",
            "properties": {
                "workflows": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string"},
                            "created_at": {"type": "number"},
                            "updated_at": {"type": "number"},
                            "version_id": {"type": "number"},
                            "entity_type_id": {"type": "number"},
                            "name": {"type": "string"},
                            "changes": {"type": "array"},
                            "follow_ups": {"type": "array"},
                            "auto_first_step": {"type": "boolean"},
                        },
                        "required": ["auto_first_step"],
                    },
                }
            },
            "required": ["workflows"],
        }

        response = self.client.get(f"{BASE_API}?app_id=blue.adults.project")

        self.assertJSONResponse(response, status.HTTP_200_OK)

        try:
            jsonschema.validate(instance=response.data, schema=set_tl_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(len(response.data["workflows"]), 2)

    def test_mobile_api_serves_auto_first_step(self):
        # auto_first_step defaults to False and is exposed per version on the mobile API.
        self.workflow_version_full_published.auto_first_step = True
        self.workflow_version_full_published.save()

        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.get(f"{BASE_API}?app_id=blue.adults.project")

        self.assertJSONResponse(response, status.HTTP_200_OK)

        by_version_id = {wf["version_id"]: wf for wf in response.data["workflows"]}
        self.assertTrue(by_version_id[self.workflow_version_full_published.pk]["auto_first_step"])
        # Every other served version keeps the default (False).
        for version_id, wf in by_version_id.items():
            if version_id != self.workflow_version_full_published.pk:
                self.assertFalse(wf["auto_first_step"])
