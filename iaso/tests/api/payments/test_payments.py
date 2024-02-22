import datetime

import time_machine

from django.utils import timezone
from django.contrib.auth.models import Group

from iaso.test import APITestCase
from iaso import models as m


class PaymentsAPITestCase(APITestCase):
    """
    Test actions on the Payments ViewSet.
    """

    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type, version=version, uuid="1539f174-4c53-499c-85de-7a58458c49ef"
        )

        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account)
        user_with_review_perm = cls.create_user_with_profile(
            username="user_with_review_perm", account=account, permissions=["iaso_payments"]
        )

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.project = project
        cls.user = user
        cls.user_with_review_perm = user_with_review_perm

    def test_list_ok(self):
        m.Payment.objects.create(user=self.user)
        m.Payment.objects.create(user=self.user)

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/payments/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(2, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get("/api/payments/")
        self.assertJSONResponse(response, 403)

    def test_retrieve_ok(self):
        payment = m.Payment.objects.create(user=self.user)
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/payments/{payment.pk}/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["id"], payment.pk)

    def test_retrieve_without_auth(self):
        payment = m.Payment.objects.create(user=self.user)
        response = self.client.get(f"/api/payments/{payment.pk}/")
        self.assertJSONResponse(response, 403)

    def test_get_potential_payments_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/payments/get_potential_payments/")
        self.assertEqual(response.status_code, 200)

    def test_get_potential_payments_without_auth(self):
        response = self.client.get("/api/payments/get_potential_payments/")
        self.assertJSONResponse(response, 403)

    def test_create_not_allowed(self):
        self.client.force_authenticate(self.user)
        data = {
            "user": self.user.id,
            "amount": 100.0,
            "status": "pending",
        }
        response = self.client.post("/api/payments/", data=data, format="json")
        self.assertEqual(response.status_code, 405)

    def test_create_without_auth(self):
        data = {
            "user": self.user.id,
            "amount": 100.0,
            "status": "pending",
        }
        response = self.client.post("/api/payments/", data=data, format="json")
        self.assertJSONResponse(response, 403)

    def test_update_not_allowed(self):
        payment = m.Payment.objects.create(user=self.user, amount=100.0, status="pending")
        self.client.force_authenticate(self.user)
        data = {
            "amount": 200.0,
            "status": "completed",
        }
        response = self.client.patch(f"/api/payments/{payment.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 405)

    def test_update_without_auth(self):
        payment = m.Payment.objects.create(user=self.user, amount=100.0, status="pending")
        data = {
            "amount": 200.0,
            "status": "completed",
        }
        response = self.client.patch(f"/api/payments/{payment.pk}/", data=data, format="json")
        self.assertJSONResponse(response, 403)
