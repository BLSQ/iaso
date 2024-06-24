import datetime

import time_machine

from iaso import models as m
from iaso.test import TestCase

from plugins.polio.models import Campaign, Round, Chronogram, ChronogramTask
from plugins.polio.models.chronogram import Period, ChronogramTemplate


DT = datetime.datetime(2024, 6, 24, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class ChronogramTestCase(TestCase):
    """
    Test Chronogram model.
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
            permissions=["iaso_polio_budget"],
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)

        # Rounds.
        cls.round_1 = Round.objects.create(number=1, campaign=cls.campaign)
        cls.round_2 = Round.objects.create(number=2, campaign=cls.campaign)

    def test_model_str(self):
        chronogram = Chronogram(round=self.round_1, created_by=self.user)
        self.assertEqual(str(chronogram), f"{chronogram.id} - Campaign OBR name - Round 1")


@time_machine.travel(DT, tick=False)
class ChronogramTaskTestCase(TestCase):
    """
    Test ChronogramTask model.
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
            permissions=["iaso_polio_budget"],
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)

        # Round.
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=DT)

        # Chronogram.
        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)

        # Chronogram tasks.
        cls.chronogram_task_1 = ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description="Assurer la commande des marqueurs",
            start_offset_in_days=-20,
            deadline_date=DT.date() - datetime.timedelta(days=10),
            user_in_charge=cls.user,
            comment="Comment 1",
        )
        cls.chronogram_task_2 = ChronogramTask.objects.create(
            period=Period.DURING,
            chronogram=cls.chronogram,
            description="Supervision journalière des activités logistiques",
            start_offset_in_days=0,
            deadline_date=DT.date(),
            user_in_charge=cls.user,
            comment="Comment 2",
        )
        cls.chronogram_task_3 = ChronogramTask.objects.create(
            period=Period.AFTER,
            chronogram=cls.chronogram,
            description="Partager le rapport de destruction des déchets",
            start_offset_in_days=14,
            deadline_date=DT.date() + datetime.timedelta(days=30),
            user_in_charge=cls.user,
            comment="Comment 2",
        )

    def test_model_str(self):
        self.assertEqual(str(self.chronogram_task_1), f"{self.chronogram_task_1.id} - PENDING")
        self.assertEqual(str(self.chronogram_task_2), f"{self.chronogram_task_2.id} - PENDING")
        self.assertEqual(str(self.chronogram_task_3), f"{self.chronogram_task_3.id} - PENDING")

    def test_round_start_date(self):
        self.assertEqual(self.chronogram_task_1.round_start_date, self.chronogram.round.started_at)
        self.assertEqual(self.chronogram_task_2.round_start_date, self.chronogram.round.started_at)
        self.assertEqual(self.chronogram_task_3.round_start_date, self.chronogram.round.started_at)

    def test_start_date(self):
        self.assertEqual(self.chronogram_task_1.start_date, datetime.date(2024, 6, 4))
        self.assertEqual(self.chronogram_task_2.start_date, datetime.date(2024, 6, 24))
        self.assertEqual(self.chronogram_task_3.start_date, datetime.date(2024, 7, 8))

    def test_is_delayed(self):
        self.assertTrue(self.chronogram_task_1.is_delayed)
        self.assertFalse(self.chronogram_task_2.is_delayed)
        self.assertFalse(self.chronogram_task_3.is_delayed)


@time_machine.travel(DT, tick=False)
class ChronogramTemplateTestCase(TestCase):
    """
    Test ChronogramTemplate model.
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
            permissions=["iaso_polio_budget"],
        )

        # Campaign.
        cls.campaign = Campaign.objects.create(obr_name="Campaign OBR name", account=cls.account)

        # Round.
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=DT)

        # Chronogram templates.
        cls.chronogram_template_1 = ChronogramTemplate.objects.create(
            account=cls.account,
            period=Period.BEFORE,
            description="Identifier les solutions pour palier aux gaps",
            start_offset_in_days=-20,
        )
        cls.chronogram_template_2 = ChronogramTemplate.objects.create(
            account=cls.account,
            period=Period.DURING,
            description="Analyse quotidienne des tableaux de bord et rétro information",
            start_offset_in_days=0,
        )
        cls.chronogram_template_3 = ChronogramTemplate.objects.create(
            account=cls.account,
            period=Period.AFTER,
            description="Elaboration de l'inventaire physique des vaccins à tous les niveaux",
            start_offset_in_days=20,
        )

    def test_model_str(self):
        self.assertEqual(str(self.chronogram_template_1), f"{self.chronogram_template_1.id} - Account")
        self.assertEqual(str(self.chronogram_template_2), f"{self.chronogram_template_2.id} - Account")
        self.assertEqual(str(self.chronogram_template_3), f"{self.chronogram_template_3.id} - Account")

    def test_create_chronogram(self):
        with self.assertNumQueries(4):
            chronogram = ChronogramTemplate.objects.create_chronogram(
                round=self.round, account=self.account, created_by=self.user
            )

        self.assertEqual(chronogram.round, self.round)
        self.assertEqual(chronogram.created_by, self.user)

        self.assertEqual(3, chronogram.tasks.count())

        task_1 = chronogram.tasks.get(description=self.chronogram_template_1.description)
        self.assertEqual(task_1.period, Period.BEFORE)
        self.assertEqual(task_1.start_offset_in_days, -20)
        self.assertEqual(task_1.created_by, self.user)

        task_2 = chronogram.tasks.get(description=self.chronogram_template_2.description)
        self.assertEqual(task_2.period, Period.DURING)
        self.assertEqual(task_2.start_offset_in_days, 0)
        self.assertEqual(task_2.created_by, self.user)

        task_3 = chronogram.tasks.get(description=self.chronogram_template_3.description)
        self.assertEqual(task_3.period, Period.AFTER)
        self.assertEqual(task_3.start_offset_in_days, 20)
        self.assertEqual(task_3.created_by, self.user)
