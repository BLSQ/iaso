import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPICompleteTestCase(BaseAPITestCase):
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

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "comment", "Comment is required in case of rejection.")

        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            ),
            data={"comment": "", "approved": False},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "comment", "Comment is required in case of rejection.")

        pk_node = self.instance.get_next_pending_nodes(self.validation_workflow).first().pk
        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            ),
            data={"comment": "Nope"},
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        res = self.client.post(
            reverse("validation_workflow_nodes-complete", kwargs={"instance_id": self.instance.id, "pk": pk_node}),
            data={"approved": True},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY), "Already completed"
        )

    def test_permissions(self):
        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)

        instance_pk = self.instance.get_next_pending_nodes(self.validation_workflow).first().pk
        with self.assertNumQueries(10):
            # 1-2: PERM
            # 3: ORG UNIT CHECK (instance)
            # 4: FILTER QUERYSET AND RETRIEVE
            # 5-6: PREFETCH (roles_required, next_node_templates)
            # 7-10: INSERT/UPDATE WITH SAVE POINTS

            res = self.client.post(
                reverse(
                    "validation_workflow_nodes-complete", kwargs={"instance_id": self.instance.id, "pk": instance_pk}
                ),
                data={"comment": "LGTM", "approved": True},
            )
            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_reject(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            ),
            data={"comment": "Nope"},
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check db
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.REJECTED)

        self.assertEqual(self.instance.validationnode_set.count(), 1)
        validation_node = self.instance.validationnode_set.first()

        self.assertEqual(validation_node.comment, "Nope")
        self.assertEqual(validation_node.created_by, self.john_wick)
        self.assertEqual(validation_node.updated_by, self.john_wick)
        self.assertEqual(validation_node.status, ValidationNodeStatus.REJECTED)

    def test_approve(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_workflow_nodes-complete",
                kwargs={
                    "instance_id": self.instance.id,
                    "pk": self.instance.get_next_pending_nodes(self.validation_workflow).first().pk,
                },
            ),
            data={"comment": "LGTM", "approved": True},
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check db
        self.assertEqual(self.instance.general_validation_status, ValidationWorkflowArtefactStatus.PENDING)

        self.assertEqual(self.instance.validationnode_set.count(), 2)
        validation_node = self.instance.validationnode_set.last()

        self.assertEqual(validation_node.comment, "LGTM")
        self.assertEqual(validation_node.created_by, self.john_wick)
        self.assertEqual(validation_node.updated_by, self.john_wick)
        self.assertEqual(validation_node.status, ValidationNodeStatus.ACCEPTED)

        validation_node = self.instance.validationnode_set.first()

        self.assertEqual(validation_node.comment, "")
        self.assertEqual(validation_node.created_by, self.john_wick)
        self.assertIsNone(validation_node.updated_by)
        self.assertEqual(validation_node.status, ValidationNodeStatus.UNKNOWN)
