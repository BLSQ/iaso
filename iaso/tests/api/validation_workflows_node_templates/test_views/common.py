import re

from iaso.models import Account, AccountFeatureFlag, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseApiTestCase(APITestCase):
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
    def enable_validation_workflow_feature_flag(*accounts):
        feature_flag, _ = AccountFeatureFlag.objects.get_or_create(
            code="SUBMISSION_VALIDATION_WORKFLOW",
            defaults={"name": "Web: Enable validation workflow"},
        )
        for account in accounts:
            account.feature_flags.add(feature_flag)

    @staticmethod
    def camel_case_to_snake_case(value):
        pattern = re.compile(r"(?<!^)(?=[A-Z])")
        return pattern.sub("_", value).lower()

    @staticmethod
    def snake_case_to_camel_case(value):
        camel_string = "".join(x.capitalize() for x in value.lower().split("_"))

        return value[0].lower() + camel_string[1:]
