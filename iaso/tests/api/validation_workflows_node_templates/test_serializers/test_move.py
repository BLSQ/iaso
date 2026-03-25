from django.test import RequestFactory
from rest_framework.settings import api_settings

from iaso.api.validation_workflows_node_templates.serializers.move import ValidationNodeTemplateMoveSerializer
from iaso.models import Account
from iaso.models.validation_workflow.templates import PositionChoices, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import TestCase


class TestValidationNodeTemplateMoveSerializer(TestCase):
    def setUp(self):
        request = RequestFactory()

        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="account2")
        self.validation_workflow = ValidationWorkflow.objects.create(name="test", account=self.account)
        self.other_validation_workflow = ValidationWorkflow.objects.create(name="test2", account=self.other_account)

        self.first_node_template = ValidationNodeTemplate.objects.create(
            name="first", workflow=self.validation_workflow
        )
        self.second_node_template = ValidationNodeTemplate.objects.create(
            name="second", workflow=self.validation_workflow
        )
        self.third_node_template = ValidationNodeTemplate.objects.create(
            name="third", workflow=self.validation_workflow
        )

        self.outer_node = ValidationNodeTemplate.objects.create(
            name="outer node", workflow=self.other_validation_workflow
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        request.user = self.john_wick
        self.context = {"request": request}

    def test_validation_empty_data(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={}, context=self.context, instance=self.first_node_template
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["position"], serializer.errors.keys())
        self.assertEqual(serializer.errors["position"][0], "This field is required.")

    def test_validation_position_required(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={"position": ""}, context=self.context, instance=self.first_node_template
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["position"], serializer.errors.keys())
        self.assertEqual(serializer.errors["position"][0], '"" is not a valid choice.')

        serializer = ValidationNodeTemplateMoveSerializer(
            data={"position": None}, context=self.context, instance=self.first_node_template
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["position"], serializer.errors.keys())
        self.assertEqual(serializer.errors["position"][0], "This field may not be null.")

    def test_validation_no_parent_node_templates_if_position_is_child_of(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={"position": PositionChoices.child_of, "name": "random name"},
            context=self.context,
            instance=self.first_node_template,
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual([api_settings.NON_FIELD_ERRORS_KEY], serializer.errors.keys())
        self.assertEqual(
            serializer.errors[api_settings.NON_FIELD_ERRORS_KEY][0],
            f"Parent node templates are required if position is set to {PositionChoices.child_of}.",
        )

    def test_validation_parent_nodes_max_one(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={
                "position": PositionChoices.child_of,
                "name": "random name",
                "parent_node_templates": [self.first_node_template.slug, self.second_node_template.slug],
            },
            context=self.context,
            instance=self.third_node_template,
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["parent_node_templates"], serializer.errors.keys())
        self.assertEqual(serializer.errors["parent_node_templates"][0], "One node maximum allowed.")

    def test_validation_parent_nodes_exclude_instance(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={
                "position": PositionChoices.child_of,
                "name": "random name",
                "parent_node_templates": [self.first_node_template.slug],
            },
            context=self.context,
            instance=self.first_node_template,
        )
        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["parent_node_templates"], serializer.errors.keys())
        self.assertEqual(
            serializer.errors["parent_node_templates"][0],
            f"Object with slug={self.first_node_template.slug} does not exist.",
        )

    def test_validation_parent_nodes_belong_to_workflow(self):
        serializer = ValidationNodeTemplateMoveSerializer(
            data={
                "position": PositionChoices.child_of,
                "name": "random name",
                "parent_node_templates": [self.outer_node.slug],
            },
            context=self.context,
            instance=self.first_node_template,
        )

        self.assertFalse(serializer.is_valid())

        self.assertCountEqual(["parent_node_templates"], serializer.errors.keys())

        self.assertEqual(
            serializer.errors["parent_node_templates"][0], f"Object with slug={self.outer_node.slug} does not exist."
        )
