import uuid

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseAPITestCase(APITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )
        self.superuser = self.create_user_with_profile(
            username="superuser.user", account=self.account, is_superuser=True, is_staff=True
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )

        self.first_node = ValidationNodeTemplate.objects.create(name="First node", workflow=self.validation_workflow)

        self.second_node = ValidationNodeTemplate.objects.create(name="Second node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)

        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, can_skip_previous_nodes=True
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

        self.add_validation_workflow_module(self.account)

        self.setup_start()

    def setup_start(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

    @staticmethod
    def add_validation_workflow_module(*accounts):
        for account in accounts:
            account_modules = account.modules or []
            if MODULE_VALIDATION_WORKFLOW not in account_modules:
                account_modules.append(MODULE_VALIDATION_WORKFLOW)
                account.modules = account_modules
                account.save()
