from iaso.models import Account
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
