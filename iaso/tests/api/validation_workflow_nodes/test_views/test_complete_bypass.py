import uuid

from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPICompleteBypassTestCase(BaseAPITestCase):
    def setUp(self):
        # create workflow
        self.account = Account.objects.create(name="account")

        # setup the validation workflow
        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )

        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, color="#ffffff"
        )

        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.validation_workflow, color="#12fa4b"
        )
        self.second_node.previous_node_templates.add(self.first_node)

        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, color="#6e6593", can_skip_previous_nodes=True
        )
        self.third_node.previous_node_templates.add(self.second_node)
        self.form = Form.objects.create(name="Form")
        self.validation_workflow.form_set.add(self.form)

        self.project = Project.objects.create(account=self.account, app_id="1.1")
        self.project.forms.add(self.form)

        self.instance = self.create_form_instance(
            form=self.form,
            project=self.project,
            uuid=str(uuid.uuid4()),
        )

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )
        self.setup_start()

    def setup_start(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

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

    def test_num_queries(self):
        instance_id = self.instance.id
        self.client.force_authenticate(self.john_wick)
        # todo : optimize later
        with self.assertNumQueries(36):
            res = self.client.post(
                reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": instance_id}),
                data={"node": "third-node", "approved": True, "comment": "OK"},
            )

            self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_approve(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete-bypass", kwargs={"instance_id": self.instance.id}),
            data={"node": "third-node", "approved": True, "comment": "OK"},
        )

        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check db

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.APPROVED)

        self.assertEqual(
            self.instance.validationnode_set.filter(node__slug="third-node").first().updated_by, self.john_wick
        )
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
