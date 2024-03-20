from iaso.tests.tasks.task_api_test_case import TaskAPITestCase
from iaso.models import Task, QUEUED
from iaso import models as m
from hat.audit import models as am
from django.contrib.contenttypes.models import ContentType


class TestPaymentsBulkUpdate(TaskAPITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.url = "/api/tasks/create/paymentsbulkupdate/"
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        other_account = m.Account.objects.create(name="Other Account", default_version=version)
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
            username="user", permissions=["iaso_payments", "iaso_sources", "iaso_data_tasks"], account=account
        )
        cls.user_no_perm = cls.create_user_with_profile(
            username="user no perm", permissions=["iaso_forms", "iaso_sources", "iaso_data_tasks"], account=account
        )
        cls.other_user = cls.create_user_with_profile(
            username="other user",
            permissions=["iaso_payments", "iaso_sources", "iaso_data_tasks"],
            account=other_account,
        )
        cls.payment_beneficiary = cls.create_user_with_profile(username="payment_beneficiary", account=account)
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
        cls.second_payment = m.Payment.objects.create(
            created_by=cls.user,
            payment_lot=cls.payment_lot,
            status=m.Payment.Statuses.PENDING,
            user=cls.payment_beneficiary,
        )
        cls.second_change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=org_unit,
            new_name="Serenne",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            payment=cls.second_payment,
        )

    def test_user_not_authenticated(self):
        """POST /api/tasks/create/paymentsbulkupdate/, no auth -> 403"""

        response = self.client.post(
            self.url,
            data={"select_all": True, "status": m.Payment.Statuses.PAID},
            format="json",
        )
        self.assertJSONResponse(response, 403)

        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_user_wrong_account(self):
        """POST /api/tasks/create/paymentsbulkupdate/ (authenticated user, but no access account of specified payment ids)"""

        self.client.force_authenticate(self.other_user)
        response = self.client.post(
            self.url,
            data={
                "select_all": False,
                "selected_ids": [self.payment.pk],
                "status": m.Payment.Statuses.REJECTED,
                "payment_lot_id": self.payment_lot.pk,
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="payments_bulk_update")
        self.assertEqual(task.launcher, self.other_user)

        # Run the task
        task = self.runAndValidateTask(task, "ERRORED")
        self.assertEqual(task.result["message"], "No matching payment found")
        self.assertEqual(self.payment.status, m.Payment.Statuses.PENDING)

    def test_user_wrong_permission(self):
        """POST /orgunits/bulkupdate (authenticated user, wrong permission)--> 403"""

        self.client.force_authenticate(self.user_no_perm)
        response = self.client.post(
            self.url,
            data={
                "select_all": False,
                "selected_ids": [self.payment.pk],
                "status": m.Payment.Statuses.REJECTED,
            },
            format="json",
        )
        self.assertJSONResponse(response, 403)

    def test_payment_bulkupdate_select_some(self):
        """POST /orgunits/bulkupdate happy path. Select some"""

        self.client.force_authenticate(self.user)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.payment.pk],
            "status": m.Payment.Statuses.PAID,
            "payment_lot_id": self.payment_lot.pk,
        }
        response = self.client.post(self.url, data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="payments_bulk_update")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, m.Payment.Statuses.PAID)

        # We expect 1 log for the PaymentLot and 1 for the payment updated
        self.assertEqual(2, am.Modification.objects.count())

        modification_payment = am.Modification.objects.get(object_id=self.payment.pk)
        self.assertEqual(ContentType.objects.get_for_model(m.Payment), modification_payment.content_type)
        self.assertEqual(self.user, modification_payment.user)
        self.assertEqual(am.PAYMENT_API_BULK, modification_payment.source)
        self.assertEqual(m.Payment.Statuses.PENDING, modification_payment.past_value[0]["fields"]["status"])
        self.assertEqual(m.Payment.Statuses.PAID, modification_payment.new_value[0]["fields"]["status"])

        # TODO assert PaymentLot Status

    def test_payment_bulkupdate_select_all(self):
        """POST /api/tasks/create/paymentsbulkupdate/ happy path (select all)"""

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            data={"select_all": True, "status": m.Payment.Statuses.PAID, "payment_lot_id": self.payment_lot.pk},
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="payments_bulk_update")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, m.Payment.Statuses.PAID)
        self.second_payment.refresh_from_db()
        self.assertEqual(self.second_payment.status, m.Payment.Statuses.PAID)

        self.assertEqual(3, am.Modification.objects.count())

    def test_payment_bulkupdate_task_select_all_but_some(self):
        """POST /orgunits/bulkupdate/ happy path (select all except some)"""

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            data={
                "select_all": True,
                "status": m.Payment.Statuses.PAID,
                "unselected_ids": [self.second_payment.pk],
                "payment_lot_id": self.payment_lot.pk,
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="payments_bulk_update")
        self.assertEqual(task.launcher, self.user)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, m.Payment.Statuses.PAID)
        self.second_payment.refresh_from_db()
        self.assertEqual(self.second_payment.status, m.Payment.Statuses.PENDING)

        self.assertEqual(2, am.Modification.objects.count())

    def test_payment_update_task_kill(self):
        """Launch the task and then kill it
        Note this actually doesn't work if it's killwed while in the transaction part.
        """
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            data={
                "select_all": True,
                "status": m.Payment.Statuses.PAID,
                "unselected_ids": [self.second_payment.pk],
                "payment_lot_id": self.payment_lot.pk,
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        self.assertValidTaskAndInDB(data["task"])

        task = Task.objects.get(id=data["task"]["id"])
        task.should_be_killed = True
        task.save()

        self.runAndValidateTask(task, "KILLED")
