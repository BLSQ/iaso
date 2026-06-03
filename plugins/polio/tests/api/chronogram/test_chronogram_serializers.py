import datetime

import time_machine

from django.utils import translation
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.test import TestCase
from plugins.polio.api.chronogram.serializers import (
    ChronogramCreateSerializer,
    ChronogramSerializer,
    ChronogramTaskSerializer,
    ChronogramTemplateTaskSerializer,
)
from plugins.polio.models import Campaign, CampaignType, Chronogram, ChronogramTask, Round
from plugins.polio.models.chronogram import ChronogramTemplateTask, Period
from plugins.polio.permissions import POLIO_BUDGET_PERMISSION


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
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY.date())

        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)
        cls.chronogram_task = ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description_en="Ordering markers",
            description_fr="Assurer la commande des marqueurs",
            start_offset_in_days=0,
            user_in_charge="John Doe",
            comment="Comment",
        )

    def test_serialize_chronogram_task(self):
        task = ChronogramTask.objects.get(pk=self.chronogram_task.pk)
        with translation.override("en"):
            serializer = ChronogramTaskSerializer(task, fields=":all")
            self.assertEqual(
                serializer.data,
                {
                    "id": self.chronogram_task.pk,
                    "chronogram": self.chronogram.pk,
                    "period": "BEFORE",
                    "get_period_display": "Before",
                    "description": "Ordering markers",
                    "description_en": "Ordering markers",
                    "description_fr": "Assurer la commande des marqueurs",
                    "start_offset_in_days": 0,
                    "deadline_date": "2024-06-27",
                    "status": "PENDING",
                    "get_status_display": "Not started",
                    "user_in_charge": "John Doe",
                    "delay_in_days": 0,
                    "comment": "Comment",
                    "created_at": "2024-06-27T14:00:00Z",
                    "created_by": None,
                    "updated_at": "2024-06-27T14:00:00Z",
                    "updated_by": None,
                },
            )
        with translation.override("fr"):
            serializer = ChronogramTaskSerializer(task, fields=":all")
            self.assertEqual(
                serializer.data,
                {
                    "id": self.chronogram_task.pk,
                    "chronogram": self.chronogram.pk,
                    "period": "BEFORE",
                    "get_period_display": "Avant",
                    "description": "Assurer la commande des marqueurs",
                    "description_en": "Ordering markers",
                    "description_fr": "Assurer la commande des marqueurs",
                    "start_offset_in_days": 0,
                    "deadline_date": "2024-06-27",
                    "status": "PENDING",
                    "get_status_display": "Pas commencé",
                    "user_in_charge": "John Doe",
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
            "description_en": "Foo EN",
            "description_fr": "Foo FR",
            "start_offset_in_days": 0,
            "status": ChronogramTask.Status.IN_PROGRESS,
            "user_in_charge": "John Doe",
            "delay_in_days": 0,
            "comment": "Comment",
        }
        serializer = ChronogramTaskSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        chronogram_task = serializer.save(created_by=self.user)

        self.assertEqual(chronogram_task.chronogram, self.chronogram)
        self.assertEqual(chronogram_task.period, "AFTER")
        self.assertEqual(chronogram_task.description_en, "Foo EN")
        self.assertEqual(chronogram_task.description_fr, "Foo FR")
        self.assertEqual(chronogram_task.start_offset_in_days, 0)
        self.assertEqual(chronogram_task.status, "IN_PROGRESS")
        self.assertEqual(chronogram_task.user_in_charge, "John Doe")
        self.assertEqual(chronogram_task.comment, "Comment")
        self.assertEqual(chronogram_task.created_by, self.user)
        self.assertEqual(chronogram_task.created_at, TODAY)


@time_machine.travel(TODAY, tick=False)
class ChronogramSerializerTestCase(TestCase):
    """
    Test ChronogramSerializer.
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
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY.date())
        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)
        cls.task_before = ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description_en="Task before",
            description_fr="Tâche avant",
            start_offset_in_days=-5,
            user_in_charge="John Doe",
            status=ChronogramTask.Status.DONE,
        )
        cls.task_during = ChronogramTask.objects.create(
            period=Period.DURING,
            chronogram=cls.chronogram,
            description_en="Task during",
            description_fr="Tâche pendant",
            start_offset_in_days=0,
            user_in_charge="John Doe",
        )
        cls.task_after = ChronogramTask.objects.create(
            period=Period.AFTER,
            chronogram=cls.chronogram,
            description_en="Task after",
            description_fr="Tâche après",
            start_offset_in_days=5,
            user_in_charge="John Doe",
        )

    def _get_chronogram(self):
        return Chronogram.objects.select_related("round__campaign", "created_by", "updated_by").get(
            pk=self.chronogram.pk
        )

    def test_serialize_default_fields(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        data = serializer.data
        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "campaign_obr_name",
                "round_number",
                "round_start_date",
                "is_on_time",
                "num_task_delayed",
                "percentage_of_completion",
                "is_on_hold",
            },
        )

    def test_serialize_all_fields(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram, fields=":all")
        data = serializer.data
        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "campaign_obr_name",
                "round_number",
                "round_start_date",
                "is_on_time",
                "num_task_delayed",
                "percentage_of_completion",
                "tasks",
                "created_at",
                "created_by",
                "updated_at",
                "updated_by",
                "is_on_hold",
            },
        )

    def test_serialize_campaign_and_round_fields(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        data = serializer.data
        self.assertEqual(data["campaign_obr_name"], "Campaign OBR name")
        self.assertEqual(data["round_number"], "1")
        self.assertEqual(data["round_start_date"], str(TODAY.date()))

    def test_serialize_is_on_time_true_when_no_delayed_tasks(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertTrue(serializer.data["is_on_time"])
        self.assertEqual(serializer.data["num_task_delayed"], 0)

    def test_serialize_percentage_of_completion(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertEqual(
            serializer.data["percentage_of_completion"],
            {"BEFORE": 100, "DURING": 0, "AFTER": 0},
        )

    def test_serialize_tasks_included_with_all_fields(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram, fields=":all")
        self.assertEqual(len(serializer.data["tasks"]), 3)

    def test_serialize_created_by(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram, fields=":all")
        self.assertEqual(
            serializer.data["created_by"],
            {"id": self.user.pk, "username": "test", "full_name": "John Doe"},
        )

    def test_serialize_updated_by_none(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram, fields=":all")
        self.assertIsNone(serializer.data["updated_by"])

    def test_is_on_hold_false_when_neither_campaign_nor_round_on_hold(self):
        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertFalse(serializer.data["is_on_hold"])

    def test_is_on_hold_true_when_campaign_on_hold(self):
        self.campaign.on_hold = True
        self.campaign.save()

        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertTrue(serializer.data["is_on_hold"])

        self.campaign.on_hold = False
        self.campaign.save()

    def test_is_on_hold_true_when_round_on_hold(self):
        self.round.on_hold = True
        self.round.save()

        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertTrue(serializer.data["is_on_hold"])

        self.round.on_hold = False
        self.round.save()

    def test_is_on_hold_true_when_both_on_hold(self):
        self.campaign.on_hold = True
        self.campaign.save()
        self.round.on_hold = True
        self.round.save()

        chronogram = self._get_chronogram()
        serializer = ChronogramSerializer(chronogram)
        self.assertTrue(serializer.data["is_on_hold"])

        self.campaign.on_hold = False
        self.campaign.save()
        self.round.on_hold = False
        self.round.save()


@time_machine.travel(TODAY, tick=False)
class ChronogramTemplateTaskSerializerTestCase(TestCase):
    """
    Test ChronogramTemplateTaskSerializer.
    """

    maxDiff = None

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
            description_en="Ordering markers",
            description_fr="Assurer la commande des marqueurs",
            start_offset_in_days=0,
            created_by=cls.user,
        )

    def test_serialize_chronogram_template_task(self):
        with translation.override("en"):
            serializer = ChronogramTemplateTaskSerializer(self.chronogram_template_task, fields=":all")
            self.assertEqual(
                serializer.data,
                {
                    "id": self.chronogram_template_task.pk,
                    "account": self.account.pk,
                    "period": "BEFORE",
                    "get_period_display": "Before",
                    "description": "Ordering markers",
                    "description_en": "Ordering markers",
                    "description_fr": "Assurer la commande des marqueurs",
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
        with translation.override("fr"):
            serializer = ChronogramTemplateTaskSerializer(self.chronogram_template_task, fields=":all")
            self.assertEqual(
                serializer.data,
                {
                    "id": self.chronogram_template_task.pk,
                    "account": self.account.pk,
                    "period": "BEFORE",
                    "get_period_display": "Avant",
                    "description": "Assurer la commande des marqueurs",
                    "description_en": "Ordering markers",
                    "description_fr": "Assurer la commande des marqueurs",
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
            "period": Period.BEFORE,
            "description_en": "Bar EN",
            "description_fr": "Bar FR",
            "start_offset_in_days": 10,
        }
        serializer = ChronogramTemplateTaskSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        chronogram_template_task = serializer.save(created_by=self.user, account=self.account)

        self.assertEqual(chronogram_template_task.account, self.account)
        self.assertEqual(chronogram_template_task.period, "BEFORE")
        self.assertEqual(chronogram_template_task.description_en, "Bar EN")
        self.assertEqual(chronogram_template_task.description_fr, "Bar FR")
        self.assertEqual(chronogram_template_task.start_offset_in_days, 10)
        self.assertEqual(chronogram_template_task.created_by, self.user)
        self.assertEqual(chronogram_template_task.created_at, TODAY)


@time_machine.travel(TODAY, tick=False)
class ChronogramCreateSerializerTestCase(TestCase):
    """
    Test ChronogramCreateSerializer.
    """

    @classmethod
    def setUpTestData(cls):
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[POLIO_BUDGET_PERMISSION],
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        # Round.
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY.date())

        # Chronogram templates.
        cls.chronogram_template_1 = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.BEFORE,
            description_en="Identify solutions for gaps",
            description_fr="Identifier les solutions pour palier aux gaps",
            start_offset_in_days=-20,
        )
        cls.chronogram_template_2 = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.DURING,
            description_en="Daily dashboard analysis and feedback",
            description_fr="Analyse quotidienne des tableaux de bord et rétro information",
            start_offset_in_days=0,
        )
        cls.chronogram_template_3 = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.AFTER,
            description_en="Drawing up a physical inventory of vaccines at all levels",
            description_fr="Elaboration de l'inventaire physique des vaccins à tous les niveaux",
            start_offset_in_days=20,
        )

    def test_deserialize(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "round": self.round.pk,
        }
        serializer = ChronogramCreateSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        chronogram = serializer.save(created_by=self.user)
        self.assertEqual(chronogram.round, self.round)
        self.assertEqual(chronogram.created_by, self.user)
        self.assertEqual(chronogram.created_at, TODAY)
        self.assertEqual(3, chronogram.tasks.count())

    def test_validate_round_unauthorized(self):
        self.round.started_at = None
        self.round.save()
        request = APIRequestFactory().get("/")
        request.user = self.user
        data = {
            "round": self.round.id,
        }
        serializer = ChronogramCreateSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn(f"Round ID {self.round.id} doesn't have a `started_at` value.", serializer.errors["round"][0])

    def test_validate_round_without_started_at(self):
        request = APIRequestFactory().get("/")
        request.user = self.user
        round = Round.objects.create(number=666, started_at=TODAY.date())
        data = {
            "round": round.id,
        }
        serializer = ChronogramCreateSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Unauthorized round for this user.", serializer.errors["round"][0])

    def test_validate_round_already_has_a_chronogram(self):
        request = APIRequestFactory().get("/")
        request.user = self.user
        Chronogram.objects.create(round=self.round, created_by=self.user)
        data = {
            "round": self.round.id,
        }
        serializer = ChronogramCreateSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("A chronogram with this round already exists.", serializer.errors["round"][0])
