from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.tests.api.validation_workflow_nodes.test_views.common import BaseAPITestCase


class ValidationNodeAPICompleteTestCase(BaseAPITestCase):
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

        self.client.force_authenticate(self.superuser)

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
        self.base_test_approve(self.john_wick)

    def base_test_approve(self, user):
        self.client.force_authenticate(user)
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
        self.assertEqual(validation_node.updated_by, user)
        self.assertEqual(validation_node.status, ValidationNodeStatus.ACCEPTED)

        validation_node = self.instance.validationnode_set.first()

        self.assertEqual(validation_node.comment, "")
        self.assertEqual(validation_node.created_by, user)
        self.assertIsNone(validation_node.updated_by)
        self.assertEqual(validation_node.status, ValidationNodeStatus.UNKNOWN)

    def test_approve_as_super_user(self):
        self.base_test_approve(self.superuser)
