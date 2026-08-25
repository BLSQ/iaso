import datetime

import time_machine

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.api.chronogram.filters import filter_for_power_bi
from plugins.polio.models import Campaign, CampaignType, Chronogram, Round
from plugins.polio.models.chronogram import ChronogramTask, Period
from plugins.polio.permissions import POLIO_CHRONOGRAM_PERMISSION


TODAY = datetime.datetime(2024, 8, 23, 16, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(TODAY, tick=False)
class ChronogramFiltersTestCase(APITestCase):
    """
    Test Chronogram Filters.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="john",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=[POLIO_CHRONOGRAM_PERMISSION],
        )

        # Campaign regular.
        cls.campaign = Campaign.objects.create(obr_name="Regular Campaign", account=cls.account)
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)
        cls.round = Round.objects.create(number=1, campaign=cls.campaign, started_at=TODAY.date())
        cls.chronogram = Chronogram.objects.create(round=cls.round, created_by=cls.user)
        ChronogramTask.objects.create(
            period=Period.BEFORE,
            chronogram=cls.chronogram,
            description_en="Task",
            description_fr="Tâche",
            start_offset_in_days=0,
        )

        # Campaign on hold.
        cls.campaign_on_hold = Campaign.objects.create(obr_name="On Hold Campaign", account=cls.account, on_hold=True)
        cls.campaign_on_hold.campaign_types.add(cls.polio_type)
        cls.round_on_hold_campaign = Round.objects.create(
            number=1, campaign=cls.campaign_on_hold, started_at=TODAY.date()
        )
        cls.chronogram_campaign_on_hold = Chronogram.objects.create(
            round=cls.round_on_hold_campaign, created_by=cls.user
        )

        # Preventive campaign.
        cls.campaign_preventive = Campaign.objects.create(
            obr_name="Preventive Campaign", account=cls.account, is_preventive=True
        )
        cls.campaign_preventive.campaign_types.add(cls.polio_type)
        cls.round_preventive = Round.objects.create(number=1, campaign=cls.campaign_preventive, started_at=TODAY.date())
        cls.chronogram_preventive = Chronogram.objects.create(round=cls.round_preventive, created_by=cls.user)

    def test_filter_for_power_bi(self):
        queryset = filter_for_power_bi(Chronogram.objects.all())

        three_months_ago = "2024-05-23 16:00:00+00:00"
        sql_query = str(queryset.query)

        self.assertIn(f'"created_at" >= {three_months_ago}', sql_query)

    def test_filter_campaign_category_on_hold(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/chronograms/?campaign_category=on_hold")
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.chronogram_campaign_on_hold.pk, ids)
        self.assertNotIn(self.chronogram.pk, ids)
        self.assertNotIn(self.chronogram_preventive.pk, ids)

    def test_filter_campaign_category_preventive(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/chronograms/?campaign_category=is_preventive")
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.chronogram_preventive.pk, ids)
        self.assertNotIn(self.chronogram.pk, ids)
        self.assertNotIn(self.chronogram_campaign_on_hold.pk, ids)

    def test_filter_campaign_category_regular(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/chronograms/?campaign_category=regular")
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.chronogram.pk, ids)
        self.assertNotIn(self.chronogram_campaign_on_hold.pk, ids)
        self.assertNotIn(self.chronogram_preventive.pk, ids)

    def test_no_campaign_category_filter_returns_all(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/polio/chronograms/")
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.chronogram.pk, ids)
        self.assertIn(self.chronogram_campaign_on_hold.pk, ids)
        self.assertIn(self.chronogram_preventive.pk, ids)
