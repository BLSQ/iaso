import re

from iaso.models import Account
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseApiTestCase(APITestCase):
    @staticmethod
    def camel_case_to_snake_case(value):
        pattern = re.compile(r"(?<!^)(?=[A-Z])")
        return pattern.sub("_", value).lower()

    @staticmethod
    def snake_case_to_camel_case(value):
        camel_string = "".join(x.capitalize() for x in value.lower().split("_"))

        return value[0].lower() + camel_string[1:]

    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")

        self.superuser = self.create_user_with_profile(username="john.super", account=self.account)

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )
