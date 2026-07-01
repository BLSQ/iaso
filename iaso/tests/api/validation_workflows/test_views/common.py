from iaso.models import Account
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import APITestCase


class BaseValidationWorkflowAPITestCase(APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )
        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )
        self.superuser = self.create_user_with_profile(
            username="john.super",
            account=self.account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION],
            is_staff=True,
            is_superuser=True,
        )

        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.base_validation_workflow_without_feature_flag,
            self.validation_workflow_without_feature_flag,
        ) = self.create_no_feature_flag_data()

        self.add_validation_workflow_module(self.account)

    def create_no_feature_flag_data(self):
        account_without_feature_flag = Account.objects.create(name="account_without_feature_flag")
        user_without_feature_flag = self.create_user_with_profile(
            username="john.no.feature.flag",
            account=account_without_feature_flag,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION],
        )
        base_validation_workflow_without_feature_flag = ValidationWorkflowService.create_validation_workflow(
            name="No feature workflow",
            account=account_without_feature_flag,
            user=user_without_feature_flag,
        )
        return (
            account_without_feature_flag,
            user_without_feature_flag,
            base_validation_workflow_without_feature_flag,
            base_validation_workflow_without_feature_flag.get_latest_version(),
        )

    @staticmethod
    def add_validation_workflow_module(*accounts):
        for account in accounts:
            account_modules = account.modules or []
            if MODULE_VALIDATION_WORKFLOW not in account_modules:
                account_modules.append(MODULE_VALIDATION_WORKFLOW.codename)
                account.modules = account_modules
                account.save()
