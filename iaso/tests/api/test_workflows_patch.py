import jsonschema

from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.models import Workflow, WorkflowVersion
from iaso.test import APITestCase

from iaso.tests.api.test_workflows import var_dump, post_answer_schema


class WorkflowsPatchAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.anon = AnonymousUser()

        blue_adults = m.Account.objects.create(name="Blue Adults")

        cls.blue_adult_1 = cls.create_user_with_profile(
            username="blue_adult_1", account=blue_adults, permissions=["iaso_workflows"]
        )

        cls.project_blue_adults = m.Project.objects.create(
            name="Blue Adults Project", app_id="blue.adults.project", account=blue_adults
        )

        cls.form_adults_blue = m.Form.objects.create(
            name="Blue Adults Form", form_id="adults_form_blue", created_at=cls.now
        )

        cls.project_blue_adults.forms.add(cls.form_adults_blue)
        cls.project_blue_adults.save()

        cls.et_adults_blue = m.EntityType.objects.create(
            name="Adults of Blue",
            created_at=cls.now,
            account=blue_adults,
            reference_form=cls.form_adults_blue,
        )
        cls.workflow_et_adults_blue = Workflow.objects.create(entity_type=cls.et_adults_blue)

        cls.workflow_version_et_adults_blue = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V1",
            reference_form=cls.form_adults_blue,
        )

    def test_user_without_auth(self):
        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"status": "PUBLISHED"}
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_user_anonymous(self):
        self.client.force_authenticate(self.anon)
        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"status": "PUBLISHED"}
        )

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_patch_nonexisting_fails(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.patch(f"/api/workflowversion/1000/", data={"status": "PUBLISHED"})

        self.assertJSONResponse(response, 404)
        assert "detail" in response.data
        assert response.data["detail"] == "Not found."

    def test_patch_transition_ok(self):
        self.client.force_authenticate(self.blue_adult_1)

        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"status": "PUBLISHED"}
        )

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=post_answer_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    def test_patch_transition_forbidden(self):
        self.client.force_authenticate(self.blue_adult_1)

        self.workflow_version_et_adults_blue.status = "PUBLISHED"
        self.workflow_version_et_adults_blue.save()

        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"status": "DRAFT"}
        )

        self.assertJSONResponse(response, 401)

        assert response.data == "Transition from PUBLISHED to DRAFT is not allowed"

    def test_patch_change_name_only(self):
        self.client.force_authenticate(self.blue_adult_1)

        new_name = "BROL"

        response = self.client.patch(
            f"/api/workflowversion/{self.workflow_version_et_adults_blue.pk}/", data={"name": new_name}
        )

        self.assertJSONResponse(response, 200)

        try:
            jsonschema.validate(instance=response.data, schema=post_answer_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        assert response.data["name"] == new_name
