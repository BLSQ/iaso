from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from rest_framework.exceptions import ValidationError

from iaso.api.validation_workflows_nodes.serializers.complete import ValidationNodeCompleteSerializer
from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.models import Account, Instance, ValidationNode, ValidationNodeTemplate, ValidationWorkflow


class TestValidationNodeCompleteSerializer(TestCase):
    def setUp(self):
        request = RequestFactory()
        request.user = AnonymousUser()

        self.context = {"request": request}

        self.instance = Instance.objects.create()
        account = Account.objects.create(name="account")
        self.node = ValidationNodeTemplate.objects.create(
            name="test", workflow=ValidationWorkflow.objects.create(name="test", account=account)
        )

    def test_validation_no_data(self):
        serializer = ValidationNodeCompleteSerializer(data={}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["comment"], serializer.errors.keys())
        self.assertEqual(serializer.errors["comment"][0], "Comment is required in case of rejection.")

    def test_comment_required_if_rejected(self):
        serializer = ValidationNodeCompleteSerializer(data={"comment": "", "approved": False}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["comment"], serializer.errors.keys())
        self.assertEqual(serializer.errors["comment"][0], "Comment is required in case of rejection.")

    def test_valid_if_rejected(self):
        serializer = ValidationNodeCompleteSerializer(data={"comment": "Nope"}, context=self.context)

        self.assertTrue(serializer.is_valid(raise_exception=False))

    @mock.patch("iaso.engine.validation_workflow.ValidationWorkflowEngine.complete_node")
    def test_raises_error_from_engine(self, m):
        m.side_effect = ValidationWorkflowEngineException("Already completed")

        # create validation node

        serializer = ValidationNodeCompleteSerializer(
            data={"comment": "LGTM", "approved": True},
            context=self.context,
            instance=ValidationNode.objects.create(instance=self.instance, node=self.node),
        )

        self.assertTrue(serializer.is_valid(raise_exception=False))
        with self.assertRaisesMessage(ValidationError, "Already completed"):
            serializer.save()
