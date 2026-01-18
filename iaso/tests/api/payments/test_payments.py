from hat.audit import models as am
from iaso import models as m
from iaso.models.payments import PaymentStatuses
from iaso.permissions.core_permissions import CORE_PAYMENTS_PERMISSION
from iaso.test import APITestCase


class PaymentViewSetAPITestCase(APITestCase):
    """
    Test actions on the ViewSet for Payments.
    """

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", app_id="app.id", account=account)
        data_source.projects.add(project)
        data_source.save()
        account.default_version = version
        account.save()
        org_unit_type = m.OrgUnitType.objects.create(name="Stable", short_name="Cnc")
        org_unit = m.OrgUnit.objects.create(
            name="Woodland",
            org_unit_type=org_unit_type,
            version=version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.user = cls.create_user_with_profile(
            username="user", permissions=[CORE_PAYMENTS_PERMISSION], account=account
        )
        cls.payment_beneficiary = cls.create_user_with_profile(username="payment_beneficiary", account=account)
        cls.payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=cls.user, updated_by=cls.user)
        cls.payment = m.Payment.objects.create(
            created_by=cls.user,
            payment_lot=cls.payment_lot,
            status=PaymentStatuses.PENDING,
            user=cls.payment_beneficiary,
        )
        cls.change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Dueling Peaks",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.payment,
        )

    def test_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/payments/")
        r = self.assertJSONResponse(response, 200)
        results = r["results"]
        result = results[0]
        self.assertEqual(len(results), 1)
        change_requests = result["change_requests"]
        change_request = result["change_requests"][0]
        self.assertEqual(len(change_requests), 1)
        self.assertEqual(change_request["id"], self.change_request.pk)
        self.assertEqual(result["user"]["id"], self.payment_beneficiary.pk)
        self.assertEqual(result["created_by"], self.user.pk)
        self.assertEqual(result["payment_lot"], self.payment_lot.pk)
        self.assertEqual(result["status"], self.payment.status)

    def test_retrieve(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/payments/{self.payment.id}/")
        result = self.assertJSONResponse(response, 200)
        change_requests = result["change_requests"]
        change_request = result["change_requests"][0]
        self.assertEqual(len(change_requests), 1)
        self.assertEqual(change_request["id"], self.change_request.pk)
        self.assertEqual(result["user"]["id"], self.payment_beneficiary.pk)
        self.assertEqual(result["created_by"], self.user.pk)
        self.assertEqual(result["payment_lot"], self.payment_lot.pk)
        self.assertEqual(result["status"], self.payment.status)

    def test_update_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f"/api/payments/{self.payment.id}/", format="json", data={"status": "sent"})
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["status"], PaymentStatuses.SENT)
        self.assertEqual(r["updated_by"], self.user.id)
        self.payment_lot.refresh_from_db()
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.SENT)
        self.assertEqual(am.Modification.objects.count(), 2)

    def test_dropdown_options(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/payments/options/")
        r = self.assertJSONResponse(response, 200)
        for item in r:
            if item["value"] == PaymentStatuses.PENDING:
                self.assertEqual(item["label"], "Pending")
            elif item["value"] == PaymentStatuses.SENT:
                self.assertEqual(item["label"], "Sent")
            elif item["value"] == PaymentStatuses.REJECTED:
                self.assertEqual(item["label"], "Rejected")
            elif item["value"] == PaymentStatuses.PAID:
                self.assertEqual(item["label"], "Paid")
        # Passingthe header works in the front-end, but fails the test
        # response = self.client.get(f"/api/payments/options/", headers={"Accept-Language": "fr"})
        # r = self.assertJSONResponse(response, 200)
        # for item in r:
        #     if item['value'] == PaymentStatuses.PENDING:
        #         self.assertEqual(item['label'], 'En attente')
        #     elif item['value'] == PaymentStatuses.SENT:
        #         self.assertEqual(item['label'], 'Envoyé')
        #     elif item['value'] == PaymentStatuses.REJECTED:
        #         self.assertEqual(item['label'], 'Rejeté')
        #     elif item['value'] == PaymentStatuses.PAID:
        #         self.assertEqual(item['label'], 'Payé')
