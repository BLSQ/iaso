from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from rest_framework.exceptions import ValidationError

from iaso.api.validation_workflows_nodes.serializers.undo import ValidationNodeUndoSerializer
from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.models import Account, Instance, ValidationNode, ValidationNodeTemplate, ValidationWorkflow


class TestValidationNodeUndoSerializer(TestCase):
    def setUp(self):
        request = RequestFactory()
        request.user = AnonymousUser()

        self.context = {"request": request}

    @mock.patch("iaso.engine.validation_workflow.ValidationWorkflowEngine.undo_node")
    def test_raises_error_from_engine(self, m):
        m.side_effect = ValidationWorkflowEngineException("Cannot undo node")

        # create validation node
        instance = Instance.objects.create()
        account = Account.objects.create(name="account")
        node = ValidationNodeTemplate.objects.create(
            name="test", workflow=ValidationWorkflow.objects.create(name="test", account=account)
        )

        serializer = ValidationNodeUndoSerializer(
            data={}, context=self.context, instance=ValidationNode.objects.create(instance=instance, node=node)
        )

        self.assertTrue(serializer.is_valid(raise_exception=False))
        with self.assertRaisesMessage(ValidationError, "Cannot undo node"):
            serializer.save()
