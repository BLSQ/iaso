from iaso.models import Account, ValidationNodeTemplate, ValidationWorkflow
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseApiTestCase(APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")

        self.superuser = self.create_user_with_profile(
            username="john.super", account=self.account, is_staff=True, is_superuser=True
        )

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

    def create_no_feature_flag_data(self):
        account_without_feature_flag = Account.objects.create(name="account_without_feature_flag")
        user_without_feature_flag = self.create_user_with_profile(
            username="john.no.feature.flag",
            account=account_without_feature_flag,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION],
        )
        validation_workflow_without_feature_flag = ValidationWorkflow.objects.create(
            name="No feature workflow",
            account=account_without_feature_flag,
            created_by=user_without_feature_flag,
        )
        node_template_without_feature_flag = ValidationNodeTemplate.objects.create(
            name="No feature node",
            workflow=validation_workflow_without_feature_flag,
        )
        return (
            account_without_feature_flag,
            user_without_feature_flag,
            validation_workflow_without_feature_flag,
            node_template_without_feature_flag,
        )

    @staticmethod
    def add_validation_workflow_module(*accounts):
        for account in accounts:
            account_modules = account.modules or []
            if MODULE_VALIDATION_WORKFLOW not in account_modules:
                account_modules.append(MODULE_VALIDATION_WORKFLOW.codename)
                account.modules = account_modules
                account.save()
