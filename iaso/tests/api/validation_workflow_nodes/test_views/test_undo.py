import uuid

from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPIUndoTestCase(BaseAPITestCase):
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

        self.client.force_authenticate(self.superuser)
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
        self.base_test_undo(self.john_wick)

    def test_undo_as_superuser(self):
        self.base_test_undo(self.superuser)

    def base_test_undo(self, user):
        self.client.force_authenticate(user)

        node = self.instance.get_next_pending_nodes().first()
        node_pk = node.pk
        # reject first node
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), user, self.instance, approved=True, comment="LGTM"
        )

        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": self.instance.id, "pk": node_pk})
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.PENDING)
        node.refresh_from_db()

        self.assertEqual(node.status, ValidationNodeStatus.UNKNOWN)

    def test_try_to_undo_another_validation_node_account(self):
        other_account = Account.objects.create(name="other-account")

        stranger = self.create_user_with_profile(
            username="stranger", account=other_account, is_staff=True, is_superuser=True
        )

        other_validation_workflow = ValidationWorkflow.objects.create(
            name="other-validation-workflow", account=other_account
        )

        other_node = ValidationNodeTemplate.objects.create(name="other first node", workflow=other_validation_workflow)
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

        node_pk = other_node.validationnode_set.first().pk

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse("validation_workflow_nodes-undo", kwargs={"instance_id": other_instance.id, "pk": node_pk})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.assertEqual(other_node.validationnode_set.count(), 2)
