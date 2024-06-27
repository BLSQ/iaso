import datetime

import time_machine

from hat.menupermissions import models as iaso_permission

from iaso import models as m
from iaso.test import APITestCase

from plugins.polio.models import Campaign, Round, Chronogram, ChronogramTask, CampaignType
from plugins.polio.models.chronogram import Period, ChronogramTemplateTask


TODAY = datetime.datetime(2024, 6, 27, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class ChronogramTaskViewSetTestCase(APITestCase):
    """
    Test ChronogramTaskViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[iaso_permission._POLIO_CHRONOGRAM],
        )

        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY.date())
        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)
        cls.chronogram_task = ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description="Assurer la commande des marqueurs",
            start_offset_in_days=0,
            user_in_charge=cls.user,
            comment="Comment",
        )

    def test_get_without_auth(self):
        response = self.client.get(f"/api/polio/chronograms/tasks/{self.chronogram_task.pk}/")
        self.assertJSONResponse(response, 401)

    def test_get_without_perm(self):
        self.user.user_permissions.clear()
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/chronograms/tasks/{self.chronogram_task.pk}/")
        self.assertJSONResponse(response, 403)

    def test_get_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/chronograms/tasks/{self.chronogram_task.pk}/")
        self.assertJSONResponse(response, 200)

    def test_create_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "chronogram": self.chronogram.pk,
            "period": Period.AFTER,
            "description": "Baz",
            "start_offset_in_days": 0,
            "status": ChronogramTask.Status.IN_PROGRESS,
            "user_in_charge": self.user.pk,
            "comment": "Comment",
        }
        response = self.client.post("/api/polio/chronograms/tasks/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        chronogram_task = ChronogramTask.objects.get(pk=response.data["id"])
        self.assertEqual(chronogram_task.period, "AFTER")
        self.assertEqual(chronogram_task.description, "Baz")
        self.assertEqual(chronogram_task.start_offset_in_days, 0)
        self.assertEqual(chronogram_task.user_in_charge, self.user)
        self.assertEqual(chronogram_task.delay_in_days, 0)
        self.assertEqual(chronogram_task.comment, "Comment")
        self.assertEqual(chronogram_task.created_by, self.user)
        self.assertEqual(chronogram_task.created_at, TODAY)
        self.assertEqual(chronogram_task.updated_by, None)
        self.assertEqual(chronogram_task.created_at, TODAY)
        self.assertEqual(self.chronogram_task.deleted_at, None)

    def test_update_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "period": Period.AFTER,
            "description": "New description",
            "start_offset_in_days": 10,
            "status": ChronogramTask.Status.DONE,
            "comment": "New comment",
        }

        response = self.client.patch(
            f"/api/polio/chronograms/tasks/{self.chronogram_task.pk}/", data=data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.chronogram_task.refresh_from_db()
        self.assertEqual(self.chronogram_task.period, "AFTER")
        self.assertEqual(self.chronogram_task.description, "New description")
        self.assertEqual(self.chronogram_task.start_offset_in_days, 10)
        self.assertEqual(self.chronogram_task.status, "DONE")
        self.assertEqual(self.chronogram_task.comment, "New comment")
        self.assertEqual(self.chronogram_task.updated_by, self.user)
        self.assertEqual(self.chronogram_task.deleted_at, None)

    def test_soft_delete_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/polio/chronograms/tasks/{self.chronogram_task.pk}/")
        self.assertEqual(response.status_code, 204)

        self.chronogram_task.refresh_from_db()
        self.assertEqual(self.chronogram_task.deleted_at, TODAY)  # Soft deleted.


@time_machine.travel(TODAY, tick=False)
class ChronogramTemplateTaskViewSetTestCase(APITestCase):
    """
    Test ChronogramTemplateTask.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[iaso_permission._POLIO_CHRONOGRAM],
        )

        cls.chronogram_template_task = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.BEFORE,
            description="Assurer la commande des marqueurs",
            start_offset_in_days=0,
            created_by=cls.user,
        )

    def test_get_without_auth(self):
        response = self.client.get(f"/api/polio/chronograms/template_tasks/{self.chronogram_template_task.pk}/")
        self.assertJSONResponse(response, 401)

    def test_get_without_perm(self):
        self.user.user_permissions.clear()
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/chronograms/template_tasks/{self.chronogram_template_task.pk}/")
        self.assertJSONResponse(response, 403)

    def test_get_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/chronograms/template_tasks/{self.chronogram_template_task.pk}/")
        self.assertJSONResponse(response, 200)

    def test_create_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "account": self.account.pk,
            "period": Period.DURING,
            "description": "Template description",
            "start_offset_in_days": 5,
        }
        response = self.client.post("/api/polio/chronograms/template_tasks/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        chronogram_template_task = ChronogramTemplateTask.objects.get(pk=response.data["id"])
        self.assertEqual(chronogram_template_task.account, self.account)
        self.assertEqual(chronogram_template_task.period, "DURING")
        self.assertEqual(chronogram_template_task.description, "Template description")
        self.assertEqual(chronogram_template_task.start_offset_in_days, 5)
        self.assertEqual(chronogram_template_task.created_by, self.user)
        self.assertEqual(chronogram_template_task.created_at, TODAY)
        self.assertEqual(chronogram_template_task.updated_by, None)
        self.assertEqual(chronogram_template_task.deleted_at, None)

    def test_update_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "period": Period.AFTER,
            "description": "New template description",
            "start_offset_in_days": 10,
        }

        response = self.client.patch(
            f"/api/polio/chronograms/template_tasks/{self.chronogram_template_task.pk}/", data=data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.chronogram_template_task.refresh_from_db()
        self.assertEqual(self.chronogram_template_task.account, self.account)
        self.assertEqual(self.chronogram_template_task.period, "AFTER")
        self.assertEqual(self.chronogram_template_task.description, "New template description")
        self.assertEqual(self.chronogram_template_task.start_offset_in_days, 10)
        self.assertEqual(self.chronogram_template_task.created_by, self.user)
        self.assertEqual(self.chronogram_template_task.created_at, TODAY)
        self.assertEqual(self.chronogram_template_task.updated_by, self.user)
        self.assertEqual(self.chronogram_template_task.deleted_at, None)

    def test_soft_delete_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/polio/chronograms/template_tasks/{self.chronogram_template_task.pk}/")
        self.assertEqual(response.status_code, 204)

        self.chronogram_template_task.refresh_from_db()
        self.assertEqual(self.chronogram_template_task.deleted_at, TODAY)  # Soft deleted.
