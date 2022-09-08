from django.db import IntegrityError

from iaso.models import Account
from iaso.test import TestCase


class AccountModelTestCase(TestCase):
    def test_name_unique(self):
        """No duplicates are allowed in account names"""
        Account.objects.create(name="a")
        with self.assertRaises(IntegrityError):
            Account.objects.create(name="a")
