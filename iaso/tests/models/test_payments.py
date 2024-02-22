from django.test import TestCase
from iaso import models as m
from django.contrib.auth.models import User
from datetime import datetime


class PaymentModelTestCase(TestCase):
    """
    Test Payment model.
    """

    @classmethod
    def setUpTestData(cls):
        user = User.objects.create(username="test_user")
        cls.org_unit = m.OrgUnit.objects.create(name="Test OrgUnit")
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=cls.org_unit, new_name="Foo")
        cls.payment = m.Payment.objects.create(user=user, status="PENDING")
        cls.payment.change_requests.add(change_request)

    def test_create(self):
        self.assertEqual(self.payment.status, "PENDING")
        self.assertEqual(self.payment.user.username, "test_user")
        self.assertEqual(self.payment.change_requests.first().new_name, "Foo")
        self.assertIsInstance(self.payment.created_at, datetime)
        self.assertIsInstance(self.payment.updated_at, datetime)


class PotentialPaymentModelTestCase(TestCase):
    """
    Test PotentialPayment model.
    """

    @classmethod
    def setUpTestData(cls):
        user = User.objects.create(username="test_user")
        cls.org_unit = m.OrgUnit.objects.create(name="Test OrgUnit")
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=cls.org_unit, new_name="Foo")
        cls.potential_payment = m.PotentialPayment.objects.create(user=user)
        cls.potential_payment.change_requests.add(change_request)

    def test_create(self):
        self.assertEqual(self.potential_payment.user.username, "test_user")
        self.assertEqual(self.potential_payment.change_requests.first().new_name, "Foo")
