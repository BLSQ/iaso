import datetime
from iaso import models as m
from hat.audit import models as am
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class PaymentLotsViewSetAPITestCase(TaskAPITestCase):
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
        # The data souces and data tasks permissions are needed because we use the task API for task related assertions
        cls.user = cls.create_user_with_profile(
            username="user", permissions=["iaso_payments", "iaso_sources", "iaso_data_tasks"], account=account
        )
        cls.payment_beneficiary = cls.create_user_with_profile(username="payment_beneficiary", account=account)
        org_unit_type = m.OrgUnitType.objects.create(name="Stable", short_name="Cnc")
        org_unit = m.OrgUnit.objects.create(
            name="Woodland",
            org_unit_type=org_unit_type,
            version=version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=cls.user, updated_by=cls.user)
        cls.payment = m.Payment.objects.create(
            user=cls.payment_beneficiary,
            payment_lot=cls.payment_lot,
            status=m.Payment.Statuses.PENDING,
            created_by=cls.user,
        )
        cls.second_payment = m.Payment.objects.create(
            created_by=cls.user,
            payment_lot=cls.payment_lot,
            status=m.Payment.Statuses.PENDING,
            user=cls.payment_beneficiary,
        )
        cls.change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Dueling Peaks",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.payment,
        )
        cls.second_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Serenne",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.second_payment,
        )
        cls.potential_payment = m.PotentialPayment.objects.create(user=cls.payment_beneficiary)
        cls.third_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Wetlands",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=cls.potential_payment,
        )

    def test_create_payment_lot(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/payments/lots/", {"name": "New Payment Lot", "potential_payments": [self.potential_payment.pk]}
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="create_payments_from_payment_lot")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.third_change_request.refresh_from_db()

        # New PaymentLot has been created with status NEW
        self.assertEqual(m.PaymentLot.objects.count(), 2)  # Including the one created in setUpTestData
        new_lot = m.PaymentLot.objects.exclude(id=self.payment_lot.pk).get()
        self.assertEqual(new_lot.status, m.PaymentLot.Statuses.NEW)

        # new payment has been added
        self.assertEqual(m.Payment.objects.count(), 3)  # 2 payments from test setup + 1 created from potential payment
        new_payment = m.Payment.objects.exclude(id__in=[self.payment.pk, self.second_payment.pk])
        self.assertTrue(new_payment.exists())
        new_payment = new_payment.get()

        # New Payment has been assigned to new Payment lot and has status PENDING
        self.assertEqual(new_payment.payment_lot, new_lot)
        self.assertEqual(new_payment.status, m.Payment.Statuses.PENDING)

        # Change request has been updated: potential payment has been deleted and replaced with new payment
        self.assertEqual(self.third_change_request.payment, new_payment)
        self.assertIsNone(self.third_change_request.potential_payment)
        self.assertFalse(m.PotentialPayment.objects.filter(id=self.potential_payment.pk).exists())

        # Changes have been logged: 1 for Payment lot at creation, 1 for payment, 1 for change request, 1 for Payment lot after all payments have been created
        self.assertEqual(4, am.Modification.objects.count())

    def test_update_payment_lot_mark_payments_as_sent(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(f"/api/payments/lots/{self.payment_lot.id}/?mark_payments_as_sent=true")
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="mark_payments_as_read")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.payment_lot.refresh_from_db()
        self.payment.refresh_from_db()
        self.second_payment.refresh_from_db()
        self.assertEqual(self.payment.status, m.Payment.Statuses.SENT)
        self.assertEqual(self.second_payment.status, m.Payment.Statuses.SENT)
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.SENT)

        self.assertEqual(3, am.Modification.objects.count())

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
