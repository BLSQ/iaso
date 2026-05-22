import uuid

from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from rest_framework.exceptions import ValidationError

from iaso.api.validation_workflows_nodes.serializers.complete_bypass import ValidationNodeCompleteBypassSerializer
from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.test import APITestCase


class TestValidationNodeCompleteBypassSerializer(APITestCase):
    def setUp(self):
        request = RequestFactory()
        request.user = AnonymousUser()

        self.context = {"request": request}

        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="other account")

        self.form = Form.objects.create(name="Form")

        self.project = Project.objects.create(account=self.account, app_id="1.1")
        self.project.forms.add(self.form)
        self.validation_workflow = ValidationWorkflow.objects.create(name="test", account=self.account)

        self.other_validation_workflow = ValidationWorkflow.objects.create(name="test", account=self.other_account)

        self.instance = self.create_form_instance(
            form=self.form,
            project=self.project,
            uuid=str(uuid.uuid4()),
        )
        self.validation_workflow.form_set.add(self.form)

        self.node = ValidationNodeTemplate.objects.create(name="test", workflow=self.validation_workflow)

        self.other_node = ValidationNodeTemplate.objects.create(
            name="other test", workflow=self.other_validation_workflow
        )

    def test_valid_node(self):
        serializer = ValidationNodeCompleteBypassSerializer(
            data={"node": "wrong"}, context=self.context, instance=self.instance
        )

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["node"], serializer.errors.keys())

        self.assertEqual(serializer.errors["node"][0], "Object with slug=wrong does not exist.")

        serializer = ValidationNodeCompleteBypassSerializer(
            data={"node": self.other_node.slug}, context=self.context, instance=self.instance
        )

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["node"], serializer.errors.keys())

        self.assertEqual(serializer.errors["node"][0], f"Object with slug={self.other_node.slug} does not exist.")

    def test_validation_no_data(self):
        serializer = ValidationNodeCompleteBypassSerializer(data={}, context=self.context, instance=self.instance)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["node"], serializer.errors.keys())
        self.assertEqual(serializer.errors["node"][0], "This field is required.")

    def test_comment_required_if_rejected(self):
        serializer = ValidationNodeCompleteBypassSerializer(
            data={"comment": "", "approved": False, "node": "test"}, context=self.context, instance=self.instance
        )

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertCountEqual(["comment"], serializer.errors.keys())
        self.assertEqual(serializer.errors["comment"][0], "Comment is required in case of rejection.")

    def test_valid_if_rejected(self):
        serializer = ValidationNodeCompleteBypassSerializer(
            data={"comment": "Nope", "node": "test"}, context=self.context, instance=self.instance
        )

        self.assertTrue(serializer.is_valid(raise_exception=False))

    @mock.patch("iaso.engine.validation_workflow.ValidationWorkflowEngine.complete_node_by_passing")
    def test_raises_error_from_engine(self, m):
        m.side_effect = ValidationWorkflowEngineException("Already completed")

        serializer = ValidationNodeCompleteBypassSerializer(
            data={"comment": "LGTM", "approved": True, "node": "test"}, context=self.context, instance=self.instance
        )

        self.assertTrue(serializer.is_valid(raise_exception=False))
        with self.assertRaisesMessage(ValidationError, "Already completed"):
            serializer.save()
