import uuid

from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPIUndoTestCase(BaseAPITestCase):
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
        pk_node = self.instance.get_next_pending_nodes(self.validation_workflow).first().pk
        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": pk_node})
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": pk_node})
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": pk_node})
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)

        node = self.instance.get_next_pending_nodes().first()
        node_pk = node.pk
        # reject first node
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, approved=True, comment="LGTM"
        )

        with self.assertNumQueries(11):
            # 1-2: PERM
            # 3: ORGUNIT
            # 4-6: RETRIEVE
            # 7: SAVEPOINT
            # 8: SELECT NODES TO DELETE
            # 9: DELETE
            # 10: UPDATE
            # 11: RELEASE

            res = self.client.post(
                reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": node_pk})
            )
            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_undo(self):
        self.client.force_authenticate(self.john_wick)

        node = self.instance.get_next_pending_nodes().first()
        node_pk = node.pk
        # reject first node
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, approved=True, comment="LGTM"
        )

        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": node_pk})
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.PENDING)
        node.refresh_from_db()

        self.assertEqual(node.status, ValidationNodeStatus.UNKNOWN)
