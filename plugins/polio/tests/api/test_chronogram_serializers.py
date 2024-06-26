import datetime

import time_machine

from iaso import models as m
from iaso.test import TestCase

from plugins.polio.api.chronogram.serializers import ChronogramTaskSerializer, ChronogramTemplateTaskSerializer
from plugins.polio.models import Campaign, Round, Chronogram, ChronogramTask
from plugins.polio.models.chronogram import Period, ChronogramTemplateTask


TODAY = datetime.datetime(2024, 6, 27, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class ChronogramTaskSerializerTestCase(TestCase):
    """
    Test ChronogramTaskSerializer.
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
        )

        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)
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

    def test_serialize_chronogram_task(self):
        serializer = ChronogramTaskSerializer(self.chronogram_task)
        self.assertEqual(
            serializer.data,
            {
                "id": self.chronogram_task.pk,
                "chronogram": self.chronogram.pk,
                "period": "BEFORE",
                "description": "Assurer la commande des marqueurs",
                "start_offset_in_days": 0,
                "deadline_date": datetime.date(2024, 6, 27),
                "status": "PENDING",
                "user_in_charge": {"id": self.user.id, "username": "test", "full_name": "John Doe"},
                "delay_in_days": 0,
                "comment": "Comment",
                "created_at": "2024-06-27T14:00:00Z",
                "created_by": None,
                "updated_at": "2024-06-27T14:00:00Z",
                "updated_by": None,
            },
        )

    def test_deserialize_chronogram_task(self):
        data = {
            "chronogram": self.chronogram.pk,
            "period": Period.AFTER,
            "description": "Foo",
            "start_offset_in_days": 0,
            "status": ChronogramTask.Status.IN_PROGRESS,
            "user_in_charge": self.user.pk,
            "delay_in_days": 0,
            "comment": "Comment",
        }
        serializer = ChronogramTaskSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        chronogram_task = serializer.save(created_by=self.user)

        self.assertEqual(chronogram_task.chronogram, self.chronogram)
        self.assertEqual(chronogram_task.period, "AFTER")
        self.assertEqual(chronogram_task.description, "Foo")
        self.assertEqual(chronogram_task.start_offset_in_days, 0)
        self.assertEqual(chronogram_task.status, "IN_PROGRESS")
        self.assertEqual(chronogram_task.user_in_charge, self.user)
        self.assertEqual(chronogram_task.delay_in_days, 0)
        self.assertEqual(chronogram_task.comment, "Comment")
        self.assertEqual(chronogram_task.created_by, self.user)
        self.assertEqual(chronogram_task.created_at, TODAY)


@time_machine.travel(TODAY, tick=False)
class ChronogramTemplateTaskSerializerTestCase(TestCase):
    """
    Test ChronogramTemplateTaskSerializer.
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
        )

        cls.chronogram_template_task = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.BEFORE,
            description="Assurer la commande des marqueurs",
            start_offset_in_days=0,
            created_by=cls.user,
        )

    def test_serialize_chronogram_template_task(self):
        serializer = ChronogramTemplateTaskSerializer(self.chronogram_template_task)
        self.assertEqual(
            serializer.data,
            {
                "id": self.chronogram_template_task.pk,
                "account": self.account.pk,
                "period": "BEFORE",
                "description": "Assurer la commande des marqueurs",
                "start_offset_in_days": 0,
                "created_at": "2024-06-27T14:00:00Z",
                "created_by": {
                    "id": self.user.pk,
                    "username": "test",
                    "full_name": "John Doe",
                },
                "updated_at": "2024-06-27T14:00:00Z",
                "updated_by": {
                    "username": "",
                    "full_name": "",
                },
            },
        )

    def test_deserialize_chronogram_template_task(self):
        data = {
            "account": self.account.pk,
            "period": Period.BEFORE,
            "description": "Bar",
            "start_offset_in_days": 10,
        }
        serializer = ChronogramTemplateTaskSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        chronogram_template_task = serializer.save(created_by=self.user)

        self.assertEqual(chronogram_template_task.account, self.account)
        self.assertEqual(chronogram_template_task.period, "BEFORE")
        self.assertEqual(chronogram_template_task.description, "Bar")
        self.assertEqual(chronogram_template_task.start_offset_in_days, 10)
        self.assertEqual(chronogram_template_task.created_by, self.user)
        self.assertEqual(chronogram_template_task.created_at, TODAY)
