from iaso.models import WorkflowFollowup
from iaso.tests.api.workflows.base import BaseWorkflowsAPITestCase

BASE_API = "/api/workflowfollowups/"


class WorkflowsFollowupsAPITestCase(BaseWorkflowsAPITestCase):
    def test_workflow_create_followup_without_auth(self):
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 401)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_workflow_create_followup_user_anonymous(self):
        self.client.force_authenticate(self.anon)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_workflow_create_followup_with_auth_no_permissions(self):
        self.client.force_authenticate(self.blue_adult_np)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_user_with_auth_no_access_to_reference_form_and_entity_type(self):
        self.client.force_authenticate(self.blue_child_1)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 400)

    def test_cannot_add_followups_to_version_not_in_draft(self):
        self.client.force_authenticate(self.blue_adult_1)
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 400)
        assert "is not in draft status" in str(response.data[0])
        assert response.data[0].code == "invalid"

    def test_cannot_create_followup_with_negative_order(self):
        self.client.force_authenticate(self.blue_adult_1)
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": -1, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response, 400)
        assert "order must be positive" in str(response.data["order"][0])
        assert response.data["order"][0].code == "invalid"

    def test_cannot_create_followup_with_non_existing_form_id(self):
        self.client.force_authenticate(self.blue_adult_1)
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [10000]},
        )

        self.assertJSONResponse(response, 400)
        assert "Form 10000 does not exist" in str(response.data["form_ids"][0])
        assert response.data["form_ids"][0].code == "invalid"

    def test_cannot_create_followup_to_form_that_he_cannot_access(self):
        self.client.force_authenticate(self.blue_adult_1)
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 0, "condition": "true", "form_ids": [self.form_children_blue.pk]},
        )

        self.assertJSONResponse(response, 400)
        assert f"User doesn't have access to form {self.form_children_blue.pk}" in str(response.data["form_ids"][0])
        assert response.data["form_ids"][0].code == "invalid"

    def test_create_bulkupdate_without_id_fails(self):
        self.client.force_authenticate(self.blue_adult_1)

        response_bulk = self.client.post(
            f"{BASE_API}bulkupdate/",
            format="json",
            data=[{"order": 1}],
        )

        assert response_bulk.status_code == 400
        assert "id is required for bulk update" in response_bulk.data

    def test_create_bulkupdate_delete(self):
        self.client.force_authenticate(self.blue_adult_1)
        response_1 = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 1, "condition": "true", "form_ids": [self.form_adults_blue.pk]},
        )

        self.assertJSONResponse(response_1, 200)
        assert response_1.data["forms"][0]["id"] == self.form_adults_blue.pk
        assert response_1.data["order"] == 1
        assert response_1.data["condition"] == "true"

        followup_1_id = response_1.data["id"]

        response_2 = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft_2.pk}",
            format="json",
            data={"order": 2, "condition": "true", "form_ids": [self.form_adults_blue_2.pk]},
        )

        self.assertJSONResponse(response_2, 200)
        assert response_2.data["forms"][0]["id"] == self.form_adults_blue_2.pk
        assert response_2.data["order"] == 2
        assert response_2.data["condition"] == "true"

        followup_2_id = response_2.data["id"]

        response_bulk = self.client.post(
            f"{BASE_API}bulkupdate/",
            format="json",
            data=[{"id": followup_1_id, "order": 2}, {"id": followup_2_id, "order": 1}],
        )

        first_obj = response_bulk.data[0]
        second_obj = response_bulk.data[1]

        self.assertJSONResponse(response_2, 200)
        assert first_obj["id"] == followup_1_id
        assert first_obj["order"] == 2
        assert WorkflowFollowup.objects.get(pk=followup_1_id).order == 2

        assert second_obj["id"] == followup_2_id
        assert second_obj["order"] == 1
        assert WorkflowFollowup.objects.get(pk=followup_2_id).order == 1

        response_delete_1 = self.client.delete(f"{BASE_API}{followup_1_id}/")
        self.assertJSONResponse(response_delete_1, 204)
        self.assertRaises(WorkflowFollowup.DoesNotExist, WorkflowFollowup.objects.get, pk=followup_1_id)

        response_delete_2 = self.client.delete(f"{BASE_API}{followup_2_id}/")
        self.assertJSONResponse(response_delete_2, 204)
        self.assertRaises(WorkflowFollowup.DoesNotExist, WorkflowFollowup.objects.get, pk=followup_2_id)
