import datetime
from iaso.test import APITestCase
from iaso import models as m


class PaymentLotsViewSetAPITestCase(APITestCase):
    """
    Test actions on the ViewSet for Payment Lots.
    """

    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        user = cls.create_user_with_profile(username="user", permissions=["iaso_payments"], account=account)
        payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=user, updated_by=user)
        payment = m.Payment.objects.create(user=user, payment_lot=payment_lot, status=m.Payment.Statuses.PENDING)
        cls.user = user
        cls.payment_lot = payment_lot
        cls.payment = payment

    def test_create_payment_lot(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/payments/lots/", {"name": "New Payment Lot"})
        self.assertJSONResponse(response, 201)
        self.assertEqual(m.PaymentLot.objects.count(), 2)  # Including the one created in setUpTestData

    # TODO Should be moved in a task test suite
    # def test_update_payment_lot_mark_payments_as_sent(self):
    #     self.client.force_authenticate(self.user)
    #     response = self.client.patch(f"/api/payments/lots/{self.payment_lot.id}/?mark_payments_as_sent=true")
    #     self.assertJSONResponse(response, 200)
    #     self.payment.refresh_from_db()
    #     self.assertEqual(self.payment.status, m.Payment.Statuses.SENT.value)

    def test_retrieve_payment_lot(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["name"], self.payment_lot.name)

    def test_retrieve_payment_lot_to_csv(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/?csv=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_retrieve_payment_lot_to_xlsx(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/?xlsx=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
