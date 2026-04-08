from iaso.models import Account, AccountFeatureFlag, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseValidationWorkflowAPITestCase(APITestCase):
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
        return account_without_feature_flag, user_without_feature_flag, validation_workflow_without_feature_flag

    @staticmethod
    def enable_validation_workflow_feature_flag(*accounts):
        feature_flag, _ = AccountFeatureFlag.objects.get_or_create(
            code="SUBMISSION_VALIDATION_WORKFLOW",
            defaults={"name": "Web: Enable validation workflow"},
        )
        for account in accounts:
            account.feature_flags.add(feature_flag)

    def assertValidValidationWorkflowListData(self, list_data, expected_length, paginated=True):
        results_key = "results"
        self.assertValidListData(
            list_data=list_data, results_key=results_key, expected_length=expected_length, paginated=False
        )

        for data in list_data[results_key]:
            self.assertIn("slug", data)
            self.assertIn("name", data)
            self.assertIn("formCount", data)
            self.assertIn("createdBy", data)
            self.assertIn("updatedBy", data)
            self.assertIn("createdAt", data)
            self.assertIn("updatedAt", data)

    def assertValidValidationWorkflowDropdownListData(self, list_data, expected_length):
        self.assertValidListData(
            list_data=list_data, results_key=None, expected_length=expected_length, paginated=False
        )
        for data in list_data:
            self.assertIn("label", data)
            self.assertIn("value", data)
