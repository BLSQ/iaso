from iaso.tests.api.workflows.base import BaseWorkflowsAPITestCase, var_dump

BASE_API = "/api/workflowchanges/"


class WorkflowsChangesAPITestCase(BaseWorkflowsAPITestCase):
    def test_workflow_create_change_without_auth(self):
        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(
            response.data["detail"], "Authentication credentials were not provided."
        )

    def test_workflow_create_change_user_anonymous(self):
        self.client.force_authenticate(self.anon)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_workflow_create_change_with_auth_no_permissions(self):
        self.client.force_authenticate(self.blue_adult_np)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_user_with_auth_no_access_to_entity_type(self):
        self.client.force_authenticate(self.blue_child_1)

        response = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        var_dump(response)
        self.assertJSONResponse(response, 400)

    def test_cannot_add_changes_to_version_not_in_draft(self):
        self.client.force_authenticate(self.blue_adult_1)
        response_fail = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        var_dump(response_fail)
        self.assertJSONResponse(response_fail, 400)
        assert "WorkflowVersion 1 is not in draft status" in str(response_fail.data[0])
        assert response_fail.data[0].code == "invalid"

        response_ok = self.client.post(
            f"{BASE_API}?version_id={self.workflow_version_et_adults_blue_draft.pk}",
            format="json",
            data={"form": self.form_adults_blue.pk, "mapping": {"fake": "data"}},
        )

        var_dump(response_ok)
