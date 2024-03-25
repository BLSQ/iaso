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
        created_by_user = User.objects.create(username="creator_user")
        cls.org_unit = m.OrgUnit.objects.create(name="Test OrgUnit")
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=cls.org_unit, new_name="Foo")
        payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=created_by_user)
        cls.payment = m.Payment.objects.create(user=user, status=m.Payment.Statuses.PENDING, payment_lot=payment_lot)
        cls.payment.change_requests.add(change_request)

    def test_create(self):
        self.assertEqual(self.payment.status, m.Payment.Statuses.PENDING)
        self.assertEqual(self.payment.user.username, "test_user")
        self.assertEqual(self.payment.change_requests.first().new_name, "Foo")
        self.assertIsInstance(self.payment.created_at, datetime)
        self.assertIsInstance(self.payment.updated_at, datetime)
        self.assertEqual(self.payment.payment_lot.name, "Test Payment Lot")


class PaymentLotModelTestCase(TestCase):
    """
    Test PaymentLot model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create(username="lot_test_user")
        created_by_user = User.objects.create(username="creator_user_lot")
        cls.payment_lot = m.PaymentLot.objects.create(name="Payment Lot Test", created_by=created_by_user)

    def test_compute_status_new(self):
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.NEW)

    def test_compute_status_paid(self):
        payment = m.Payment.objects.create(user=self.user, status=m.Payment.Statuses.PAID, payment_lot=self.payment_lot)
        self.payment_lot.save()
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.PAID)

    def test_compute_status_partially_paid(self):
        m.Payment.objects.create(user=self.user, status=m.Payment.Statuses.PAID, payment_lot=self.payment_lot)
        m.Payment.objects.create(user=self.user, status=m.Payment.Statuses.PENDING, payment_lot=self.payment_lot)
        self.payment_lot.save()
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.PARTIALLY_PAID)

    def test_compute_status_sent(self):
        m.Payment.objects.create(user=self.user, status=m.Payment.Statuses.SENT, payment_lot=self.payment_lot)
        m.Payment.objects.create(user=self.user, status=m.Payment.Statuses.SENT, payment_lot=self.payment_lot)
        self.payment_lot.save()
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.SENT)


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
