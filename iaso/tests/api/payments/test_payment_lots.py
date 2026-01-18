from hat.audit import models as am
from iaso import models as m
from iaso.models.payments import PaymentStatuses
from iaso.permissions.core_permissions import (
    CORE_DATA_TASKS_PERMISSION,
    CORE_PAYMENTS_PERMISSION,
    CORE_SOURCE_PERMISSION,
)
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class PaymentLotsViewSetAPITestCase(TaskAPITestCase):
    """
    Test actions on the ViewSet for Payment Lots.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        # The data souces and data tasks permissions are needed because we use the task API for task related assertions
        cls.user = cls.create_user_with_profile(
            username="user",
            permissions=[CORE_PAYMENTS_PERMISSION, CORE_SOURCE_PERMISSION, CORE_DATA_TASKS_PERMISSION],
            account=account,
        )
        cls.geo_limited_user = cls.create_user_with_profile(
            username="other_user",
            permissions=[CORE_PAYMENTS_PERMISSION, CORE_SOURCE_PERMISSION, CORE_DATA_TASKS_PERMISSION],
            account=account,
        )
        cls.payment_beneficiary = cls.create_user_with_profile(
            username="payment_beneficiary", first_name="John", last_name="Doe", account=account
        )
        cls.payment_beneficiary2 = cls.create_user_with_profile(
            username="payment_beneficiary2", first_name="Jim", last_name="Doe", account=account
        )
        org_unit_type = m.OrgUnitType.objects.create(name="Stable", short_name="Cnc")
        cls.org_unit = m.OrgUnit.objects.create(
            name="Woodland",
            org_unit_type=org_unit_type,
            version=version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.other_org_unit = m.OrgUnit.objects.create(
            name="Some other place",
            org_unit_type=org_unit_type,
            version=version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.geo_limited_user.iaso_profile.org_units.set([cls.other_org_unit])
        cls.payment_lot = m.PaymentLot.objects.create(name="Test Payment Lot", created_by=cls.user, updated_by=cls.user)
        cls.payment = m.Payment.objects.create(
            user=cls.payment_beneficiary,
            payment_lot=cls.payment_lot,
            status=PaymentStatuses.PENDING,
            created_by=cls.user,
        )
        cls.second_payment = m.Payment.objects.create(
            created_by=cls.user,
            payment_lot=cls.payment_lot,
            status=PaymentStatuses.PENDING,
            user=cls.payment_beneficiary,
        )
        cls.change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=cls.org_unit,
            new_name="Dueling Peaks",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.payment,
        )
        cls.second_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=cls.org_unit,
            new_name="Serenne",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.second_payment,
        )
        cls.potential_payment = m.PotentialPayment.objects.create(user=cls.payment_beneficiary)
        running_task = m.Task.objects.create(launcher=cls.user, account=cls.user.iaso_profile.account, status="SUCCESS")
        cls.potential_payment_with_task = m.PotentialPayment.objects.create(
            user=cls.payment_beneficiary2, task=running_task
        )

        cls.third_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=cls.org_unit,
            new_name="Wetlands",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=cls.potential_payment,
        )

        cls.form1 = m.Form.objects.create(name="Vaccine form")
        cls.form2 = m.Form.objects.create(name="Other form")
        cls.form3 = m.Form.objects.create(name="Population form")
        cls.instance1 = m.Instance.objects.create(form=cls.form1, org_unit=cls.org_unit)
        cls.instance2 = m.Instance.objects.create(form=cls.form2, org_unit=cls.org_unit)
        cls.instance3 = m.Instance.objects.create(form=cls.form3, org_unit=cls.org_unit)

        cls.change_request.new_reference_instances.set([cls.instance1, cls.instance3])
        cls.second_change_request.new_reference_instances.set([cls.instance2])

    def test_create_payment_lot(self):
        self.client.force_authenticate(self.user)

        # Invalid format for `potential_payments`.
        data = {"name": "New Payment Lot", "potential_payments": "foo"}
        response = self.client.post("/api/payments/lots/", data, format="json")
        self.assertJSONResponse(response, 400)
        self.assertEqual(response.json(), ["Expecting `potential_payments` to be a list of IDs."])

        # No `potential_payments`.
        data = {"name": "New Payment Lot"}
        response = self.client.post("/api/payments/lots/", data, format="json")
        self.assertJSONResponse(response, 400)
        self.assertEqual(response.json(), ["At least one potential payment required."])

        # `potential_payments` is a list of multiple IDs.
        potential_payment_ids = [self.potential_payment.pk, self.potential_payment_with_task.pk]
        data = {"name": "New Payment Lot", "potential_payments": potential_payment_ids}
        response = self.client.post("/api/payments/lots/", data, format="json")
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="create_payment_lot")
        self.assertEqual(task.launcher, self.user)
        self.assertCountEqual(task.params["kwargs"]["potential_payment_ids"], potential_payment_ids)
        self.runAndValidateTask(task, "ERRORED")

        # `potential_payments` is a list containing only one ID.
        potential_payment_ids = [self.potential_payment.pk]
        data = {"name": "New Payment Lot", "potential_payments": potential_payment_ids}
        response = self.client.post("/api/payments/lots/", data, format="json")
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="create_payment_lot")
        self.assertEqual(task.launcher, self.user)
        self.assertCountEqual(task.params["kwargs"]["potential_payment_ids"], potential_payment_ids)

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
        self.assertEqual(new_payment.status, PaymentStatuses.PENDING)

        # Change request has been updated: potential payment has been deleted and replaced with new payment
        self.assertEqual(self.third_change_request.payment, new_payment)
        self.assertIsNone(self.third_change_request.potential_payment)
        self.assertFalse(m.PotentialPayment.objects.filter(id=self.potential_payment.pk).exists())

        # Changes have been logged: 1 for payment, 1 for change request, 1 for Payment lot after all payments have been created
        self.assertEqual(3, am.Modification.objects.count())

    def test_update_payment_lot_mark_payments_as_sent(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            f"/api/payments/lots/{self.payment_lot.id}/?mark_payments_as_sent=true", format="json"
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="mark_payments_as_read")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.payment_lot.refresh_from_db()
        self.payment.refresh_from_db()
        self.second_payment.refresh_from_db()
        self.assertEqual(self.payment.status, PaymentStatuses.SENT)
        self.assertEqual(self.second_payment.status, PaymentStatuses.SENT)
        self.assertEqual(self.payment_lot.status, m.PaymentLot.Statuses.SENT)

        self.assertEqual(3, am.Modification.objects.count())

    def test_retrieve_payment_lot(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/", format="json")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["name"], self.payment_lot.name)

    def test_retrieve_payment_lot_to_csv(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/?csv=true", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        response_csv = response.getvalue().decode("utf-8")
        self.assertTrue(len(response_csv) > 0)

    def test_retrieve_payment_lot_to_xlsx(self):
        self.client.force_authenticate(self.user)

        extra_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=self.second_payment,
        )
        extra_change_request.new_reference_instances.set([self.instance1, self.instance2, self.instance3])

        with self.assertNumQueries(10):
            response = self.client.get(f"/api/payments/lots/{self.payment_lot.id}/?xlsx=true", format="json")
            excel_columns, excel_data = self.assertXlsxFileResponse(response)

        self.assertEqual(
            excel_columns,
            [
                "ID",
                "Status",
                "User ID",
                "User Username",
                "User Phone",
                "User Last Name",
                "User First Name",
                "Change Requests",
                "Total Change Requests Count",
                "Org Unit Creation Count",
                "Org Unit Change Count",
                # The following columns are dynamic and should be sorted alphabetically.
                "Form: Other form",
                "Form: Population form",
                "Form: Vaccine form",
            ],
        )

        self.assertDictEqual(
            excel_data,
            {
                "ID": {
                    0: self.second_payment.id,
                    1: self.payment.id,
                },
                "Status": {
                    0: "pending",
                    1: "pending",
                },
                "User ID": {
                    0: self.payment_beneficiary.id,
                    1: self.payment_beneficiary.id,
                },
                "User Username": {
                    0: "payment_beneficiary",
                    1: "payment_beneficiary",
                },
                "User Phone": {
                    0: None,
                    1: None,
                },
                "User Last Name": {
                    0: "Doe",
                    1: "Doe",
                },
                "User First Name": {
                    0: "John",
                    1: "John",
                },
                "Change Requests": {
                    0: (
                        f"ID: {self.second_change_request.id}, Org Unit: {self.second_change_request.org_unit.name} (ID: {self.second_change_request.org_unit.id})"
                        "\n"
                        f"ID: {extra_change_request.id}, Org Unit: {extra_change_request.org_unit.name} (ID: {extra_change_request.org_unit.id})"
                    ),
                    1: f"ID: {self.change_request.id}, Org Unit: {self.change_request.org_unit.name} (ID: {self.change_request.org_unit.id})",
                },
                "Total Change Requests Count": {
                    0: 2,
                    1: 1,
                },
                "Org Unit Creation Count": {
                    0: 0,
                    1: 0,
                },
                "Org Unit Change Count": {
                    0: 2,
                    1: 1,
                },
                # Dynamic form columns.
                "Form: Other form": {
                    0: 2,
                    1: 0,
                },
                "Form: Population form": {
                    0: 1,
                    1: 1,
                },
                "Form: Vaccine form": {
                    0: 1,
                    1: 1,
                },
            },
        )

    def test_payment_lot_not_created_if_potential_payment_has_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/payments/lots/",
            {
                "name": "New Payment Lot",
                "potential_payments": [self.potential_payment.pk, self.potential_payment_with_task.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="create_payment_lot")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        # No new payment lot created, we find only the one from setup
        self.assertEqual(m.PaymentLot.objects.count(), 1)

    def test_payment_lot_not_created_if_potential_payment_not_found(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/payments/lots/",
            {
                "name": "New Payment Lot",
                "potential_payments": [self.potential_payment.pk, self.potential_payment_with_task.pk + 100],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="create_payment_lot")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        # No new payment lot created, we find only the one from setup
        self.assertEqual(m.PaymentLot.objects.count(), 1)

    def test_geo_limited_user_cannot_see_change_requests_not_in_org_units(self):
        self.client.force_authenticate(self.geo_limited_user)
        response = self.client.get("/api/payments/lots/", format="json")
        self.assertJSONResponse(response, 200)
        data = response.json()
        results = data["results"]
        result = results[0]
        self.assertEqual(len(results), 1)
        self.assertFalse(result["can_see_change_requests"])
        self.assertEqual(len(result["payments"]), 2)
        change_requests = result["payments"][0]["change_requests"]
        self.assertEqual(len(change_requests), 1)
        for change_request in change_requests:
            self.assertFalse(change_request["can_see_change_request"])
        change_requests = result["payments"][1]["change_requests"]
        self.assertEqual(len(change_requests), 1)
        for change_request in change_requests:
            self.assertFalse(change_request["can_see_change_request"])
