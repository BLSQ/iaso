import datetime

import time_machine

from iaso import models as m
from iaso.test import TestCase

from plugins.polio.models import Campaign, Round, Chronogram, ChronogramTask, CampaignType
from plugins.polio.models.chronogram import Period, ChronogramTemplateTask


TODAY = datetime.datetime(2024, 6, 24, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class ChronogramTaskTestCase(TestCase):
    """
    Test Chronogram and ChronogramTask models.
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
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        # Round.
        round_start = (TODAY - datetime.timedelta(days=10)).date()
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=round_start)

        # Chronogram.
        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)

        # Chronogram tasks.
        cls.chronogram_task_1 = ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description="Assurer la commande des marqueurs",
            start_offset_in_days=-20,
            user_in_charge=cls.user,
            comment="Comment 1",
        )
        cls.chronogram_task_2 = ChronogramTask.objects.create(
            period=Period.DURING,
            chronogram=cls.chronogram,
            description="Supervision journalière des activités logistiques",
            start_offset_in_days=0,
            user_in_charge=cls.user,
            comment="Comment 2",
        )
        cls.chronogram_task_3 = ChronogramTask.objects.create(
            period=Period.AFTER,
            chronogram=cls.chronogram,
            description="Partager le rapport de destruction des déchets",
            start_offset_in_days=14,
            user_in_charge=cls.user,
            comment="Comment 2",
        )

    def test_chronogram_str(self):
        self.assertEqual(str(self.chronogram), f"{self.chronogram.id} - Campaign OBR name - Round 1")

    def test_chronogram_task_str(self):
        self.assertEqual(str(self.chronogram_task_1), f"{self.chronogram_task_1.id} - PENDING")
        self.assertEqual(str(self.chronogram_task_2), f"{self.chronogram_task_2.id} - PENDING")
        self.assertEqual(str(self.chronogram_task_3), f"{self.chronogram_task_3.id} - PENDING")

    def test_chronogram_task_deadline_date_and_delay(self):
        self.assertEqual(TODAY.strftime("%d-%m-%Y"), "24-06-2024")

        self.assertEqual(self.round.started_at.strftime("%d-%m-%Y"), "14-06-2024")

        self.assertEqual(self.chronogram_task_1.deadline_date.strftime("%d-%m-%Y"), "25-05-2024")
        # Should've been finished 30 days ago.
        self.assertEqual(self.chronogram_task_1.delay_in_days, -30)

        self.assertEqual(self.chronogram_task_2.deadline_date.strftime("%d-%m-%Y"), "14-06-2024")
        # Should've been finished 10 days ago.
        self.assertEqual(self.chronogram_task_2.delay_in_days, -10)

        self.assertEqual(self.chronogram_task_3.deadline_date.strftime("%d-%m-%Y"), "28-06-2024")
        # Still 4 days to go.
        self.assertEqual(self.chronogram_task_3.delay_in_days, 4)

    def test_chronogram_is_on_time(self):
        self.assertFalse(self.chronogram.is_on_time)

        self.chronogram_task_1.start_offset_in_days = 10
        self.chronogram_task_1.save()
        self.chronogram_task_2.start_offset_in_days = 20
        self.chronogram_task_2.save()
        self.chronogram_task_3.start_offset_in_days = 20
        self.chronogram_task_3.save()
        self.assertTrue(self.chronogram.is_on_time)

    def test_chronogram_num_task_delayed(self):
        self.assertEqual(self.chronogram.num_task_delayed, 2)

        self.chronogram_task_1.start_offset_in_days = 10
        self.chronogram_task_1.save()
        self.chronogram_task_2.start_offset_in_days = 20
        self.chronogram_task_2.save()
        self.chronogram_task_3.start_offset_in_days = 20
        self.chronogram_task_3.save()
        self.assertEqual(self.chronogram.num_task_delayed, 0)

    def test_percentage_of_completion(self):
        for i in range(3):
            ChronogramTask.objects.create(
                period=Period.BEFORE,
                status=ChronogramTask.Status.DONE,
                chronogram=self.chronogram,
                start_offset_in_days=i,
                user_in_charge=self.user,
            )
        ChronogramTask.objects.create(
            period=Period.DURING,
            status=ChronogramTask.Status.DONE,
            chronogram=self.chronogram,
            start_offset_in_days=0,
            user_in_charge=self.user,
        )

        with self.assertNumQueries(1):
            percentage_of_completion = self.chronogram.percentage_of_completion
            self.assertEqual(percentage_of_completion[Period.BEFORE], 75)
            self.assertEqual(percentage_of_completion[Period.DURING], 50)
            self.assertEqual(percentage_of_completion[Period.AFTER], 0)


@time_machine.travel(TODAY, tick=False)
class ChronogramTemplateTaskTestCase(TestCase):
    """
    Test ChronogramTemplateTask model.
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
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        # Round.
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY)

        # Chronogram templates.
        cls.chronogram_template_1 = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.BEFORE,
            description="Identifier les solutions pour palier aux gaps",
            start_offset_in_days=-20,
        )
        cls.chronogram_template_2 = ChronogramTemplateTask.objects.create(
            account=cls.account,
            period=Period.DURING,
            description="Analyse quotidienne des tableaux de bord et rétro information",
            start_offset_in_days=0,
        )
        cls.chronogram_template_3 = ChronogramTemplateTask.objects.create(
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
            chronogram = ChronogramTemplateTask.objects.create_chronogram(round=self.round, created_by=self.user)

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
