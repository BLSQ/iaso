from iaso.test import APITestCase
from iaso import models as m
from hat.audit import models as am


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
        cls.user = cls.create_user_with_profile(username="user", permissions=["iaso_payments"], account=account)
        cls.payment_beneficiary = cls.create_user_with_profile(
            username="payment_beneficiary", permissions=["iaso_payments"], account=account
        )
        cls.payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=cls.user, updated_by=cls.user)
        cls.payment = m.Payment.objects.create(
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
        cls.payment_to_self = m.Payment.objects.create(
            created_by=cls.payment_beneficiary,
            payment_lot=cls.payment_lot,
            status=m.Payment.Statuses.PENDING,
            user=cls.user,
        )
        cls.second_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Serenne",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.payment_to_self,
        )

    def test_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/payments/")
        r = self.assertJSONResponse(response, 200)
        results = r["results"]
        result = results[0]
        self.assertEquals(len(results), 2)  # users can see payment for themeselves, just not update them
        change_requests = result["change_requests"]
        change_request = result["change_requests"][0]
        self.assertEquals(len(change_requests), 1)
        self.assertEquals(change_request["id"], self.change_request.pk)
        self.assertEquals(result["user"]["id"], self.payment_beneficiary.pk)
        self.assertEquals(result["created_by"], self.user.pk)
        self.assertEquals(result["payment_lot"], self.payment_lot.pk)
        self.assertEquals(result["status"], self.payment.status)

    def test_retrieve(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/payments/{self.payment.id}/")
        result = self.assertJSONResponse(response, 200)
        change_requests = result["change_requests"]
        change_request = result["change_requests"][0]
        self.assertEquals(len(change_requests), 1)
        self.assertEquals(change_request["id"], self.change_request.pk)
        self.assertEquals(result["user"]["id"], self.payment_beneficiary.pk)
        self.assertEquals(result["created_by"], self.user.pk)
        self.assertEquals(result["payment_lot"], self.payment_lot.pk)
        self.assertEquals(result["status"], self.payment.status)

    def test_update_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f"/api/payments/{self.payment.id}/", format="json", data={"status": "sent"})
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["status"], m.Payment.Statuses.SENT)
        self.assertEqual(r["updated_by"], self.user.id)

        # update second payment so all payments are sent
        self.client.force_authenticate(user=self.payment_beneficiary)
        response = self.client.patch(
            f"/api/payments/{self.payment_to_self.id}/", format="json", data={"status": "sent"}
        )
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["status"], m.Payment.Statuses.SENT)
        self.assertEqual(r["updated_by"], self.payment_beneficiary.id)
        self.payment_lot.refresh_from_db()
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.SENT)
        self.assertEqual(am.Modification.objects.count(), 3)

    def test_update_own_payment(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/payments/{self.payment_to_self.id}/", format="json", data={"status": "sent"}
        )
        self.assertJSONResponse(response, 400)
