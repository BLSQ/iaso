import uuid

from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPICompleteBypassTestCase(BaseAPITestCase):
    def test_permissions(self):
        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id})
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id})
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id})
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id})
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        instance_id = self.instance.id
        self.client.force_authenticate(self.john_wick)
        # todo : optimize later
        with self.assertNumQueries(35):
            res = self.client.post(
                reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": instance_id}),
                data={"node": "third-node", "approved": True, "comment": "OK"},
            )

            self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_approve(self):
        self.base_test_approve(self.john_wick)

    def test_approve_as_superuser(self):
        self.base_test_approve(self.superuser)

    def base_test_approve(self, user):
        self.client.force_authenticate(user)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id}),
            data={"node": "third-node", "approved": True, "comment": "OK"},
        )

        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check db

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.APPROVED)

        self.assertEqual(self.instance.validationnode_set.filter(node__slug="third-node").first().updated_by, user)
        self.assertEqual(self.instance.validationnode_set.filter(node__slug="third-node").first().comment, "OK")
        self.assertEqual(
            self.instance.validationnode_set.filter(node__slug="third-node").first().status,
            ValidationNodeStatus.ACCEPTED,
        )

    def test_reject(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id}),
            data={"node": "third-node", "approved": False, "comment": "Nope"},
        )

        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check db

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.REJECTED)

        self.assertEqual(
            self.instance.validationnode_set.filter(node__slug="third-node").first().updated_by, self.john_wick
        )
        self.assertEqual(self.instance.validationnode_set.filter(node__slug="third-node").first().comment, "Nope")
        self.assertEqual(
            self.instance.validationnode_set.filter(node__slug="third-node").first().status,
            ValidationNodeStatus.REJECTED,
        )

    def test_try_to_complete_bypass_another_validation_node_account(self):
        other_account = Account.objects.create(name="other-account")

        stranger = self.create_user_with_profile(
            username="stranger", account=other_account, is_staff=True, is_superuser=True
        )

        other_validation_workflow = ValidationWorkflow.objects.create(
            name="other-validation-workflow", account=other_account
        )

        other_node = ValidationNodeTemplate.objects.create(name="other first node", workflow=other_validation_workflow)
        other_second_node = ValidationNodeTemplate.objects.create(
            name="other second node", workflow=other_validation_workflow
        )
        other_second_node.previous_node_templates.add(other_node)
        other_form = Form.objects.create(name="other form")
        other_project = Project.objects.create(account=other_account, app_id="1.3")
        other_project.forms.add(other_form)

        other_instance = self.create_form_instance(
            form=other_form,
            project=other_project,
            uuid=str(uuid.uuid4()),
        )

        other_validation_workflow.form_set.add(other_form)
        ValidationWorkflowEngine.start(other_validation_workflow, stranger, other_instance)

        self.assertEqual(other_node.validationnode_set.count(), 2)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": other_instance.id}),
            data={"node": other_second_node.slug, "approved": False, "comment": "Nope"},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.assertEqual(other_node.validationnode_set.count(), 2)
