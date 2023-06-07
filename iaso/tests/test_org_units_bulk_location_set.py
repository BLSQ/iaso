import unittest

from django.contrib.auth.models import User, Permission

from iaso.models import Account


class MyTestCase(unittest.TestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.get(username="test")
        cls.account = Account.objects.get(name="test")
