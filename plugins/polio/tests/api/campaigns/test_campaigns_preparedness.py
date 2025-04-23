from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.test import APITestCase
from plugins.polio.models import CampaignType
from plugins.polio.models.base import SpreadSheetImport
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.preparedness.summary import find_snapshot_for_date
from plugins.polio.tests.api.test import PolioTestCaseMixin


class PreparednessAPITestCase(APITestCase, PolioTestCaseMixin):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    account: Account

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = timezone.now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account, permissions=["iaso_forms"])
        cls.project = m.Project.objects.create(name="project", app_id="project.app", account=cls.account)
        cls.data_source.projects.set([cls.project])
        cls.country_type = cls.create_org_unit_type(name="COUNTRY", category="COUNTRY", projects=[cls.project])
        cls.district_type = cls.create_org_unit_type(name="DISTRICT", category="DISTRICT", projects=[cls.project])
        cls.campaign, cls.round_1, cls.round_2, cls.round_3, cls.country, cls.district = cls.create_campaign(
            "test_sia", cls.account, cls.source_version_1, cls.country_type, cls.district_type
        )

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_two_campaign_round_empty(self):
        type, created = CampaignType.objects.get_or_create(name=CampaignType.POLIO)
        campaign_a = Campaign.objects.create(obr_name="campaign A", account=self.account)
        campaign_a.campaign_types.add(type)
        campaign_a.rounds.create(number=1)
        campaign_a.rounds.create(number=3)
        Campaign.objects.create(obr_name="campaign B", account=self.account)
        Campaign.objects.create(obr_name="campaign c", account=self.account)

        response = self.client.get(f"/api/polio/campaigns/{campaign_a.id}/", format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 2)

        response = self.client.get("/api/polio/preparedness_dashboard/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 0)

    def test_two_campaign_round_error(self):
        type, created = CampaignType.objects.get_or_create(name=CampaignType.POLIO)
        campaign_a = Campaign.objects.create(obr_name="campaign A", account=self.account)
        campaign_a.campaign_types.add(type)
        round_one = campaign_a.rounds.create(number=1)
        round_three = campaign_a.rounds.create(number=3)
        campaign_b = Campaign.objects.create(obr_name="campaign B", account=self.account)
        campaign_c = Campaign.objects.create(obr_name="campaign c", account=self.account)
        campaign_b.campaign_types.add(type)
        campaign_c.campaign_types.add(type)
        response = self.client.get(f"/api/polio/campaigns/{campaign_a.id}/", format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 2)

        round_one.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_one.save()
        round_three.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_three.save()

        response = self.client.get("/api/polio/preparedness_dashboard/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        for campaign_round in r:
            self.assertEqual(campaign_round["status"], "not_sync")

        """[{'campaign_id': '6ecda204-2206-4ae2-a38a-5359684dccf6', 'campaign_obr_name': 'campaign A',
          'indicators': {}, 'round': 'Round1', 'round_id': 44, 'round_start': None, 'round_end': None,
          'status': 'not_sync', 'details': 'This spreadsheet has not been synchronised yet'}, {
                'campaign_id': '6ecda204-2206-4ae2-a38a-5359684dccf6', 'campaign_obr_name': 'campaign A',
                'indicators': {}, 'round': 'Round3', 'round_id': 45, 'round_start': None, 'round_end': None,
                'status': 'not_sync', 'details': 'This spreadsheet has not been synchronised yet'}]"""

    def test_find_snapshot_for_date_previous_sheet_only(self):
        # Use the nearest previous sheet if no sheet for date and no next_sheet
        reference_date = self.round_1.started_at - timedelta(days=14)
        previous_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "previous"},
            spread_id=self.campaign.obr_name,
        )
        previous_sheet.created_at = reference_date - timedelta(days=2)
        previous_sheet.save()
        previous_sheet.refresh_from_db()

        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, previous_sheet)

    def test_find_snapshot_for_date_next_sheet_only(self):
        # Use the nearest next sheet if no previous sheet and next sheet created_at <= ref date +2
        reference_date = self.round_1.started_at - timedelta(days=14)
        next_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "next"},
            spread_id=self.campaign.obr_name,
        )
        next_sheet.created_at = reference_date + timedelta(days=2)
        next_sheet.save()
        next_sheet.refresh_from_db()

        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, next_sheet)

    def test_find_snapshot_for_date_select_previous(self):
        # Use the nearest previous sheet if it's closer to ref date than the next_sheet
        reference_date = self.round_1.started_at - timedelta(days=14)
        previous_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "previous"},
            spread_id=self.campaign.obr_name,
        )
        previous_sheet.created_at = reference_date - timedelta(days=1)
        previous_sheet.save()

        next_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "next"},
            spread_id=self.campaign.obr_name,
        )
        next_sheet.created_at = reference_date + timedelta(days=2)
        next_sheet.save()

        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, previous_sheet)

        # If previous and next are "equidistant", select previous sheet
        previous_sheet.created_at = reference_date - timedelta(days=2)
        previous_sheet.save()
        previous_sheet.refresh_from_db()

        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, previous_sheet)

    def test_find_snapshot_for_date_select_next(self):
        # Use the nearest next sheet if it's closer to ref date than previous_sheet
        reference_date = self.round_1.started_at - timedelta(days=14)
        previous_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "previous"},
            spread_id=self.campaign.obr_name,
        )
        previous_sheet.created_at = reference_date - timedelta(days=3)
        previous_sheet.save()

        next_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "next"},
            spread_id=self.campaign.obr_name,
        )
        next_sheet.created_at = reference_date + timedelta(days=2)
        next_sheet.save()

        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, next_sheet)

        # If next sheet date is more than 2 days later than ref date, select previous sheet
        next_sheet.created_at = reference_date + timedelta(days=3)
        next_sheet.save()
        previous_sheet.refresh_from_db()
        previous_sheet.created_at = reference_date - timedelta(days=4)
        previous_sheet.save()
        previous_sheet.refresh_from_db()

        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertEqual(snapshot, previous_sheet)

    def test_find_snapshot_for_date_return_none(self):
        # return None if no previous and next sheet
        reference_date = self.round_1.started_at - timedelta(days=14)

        # No sheet snapshot
        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertIsNone(snapshot)

        # timedelta of next sheet too big to be considered
        next_sheet = SpreadSheetImport.objects.create(
            url="https://www.example.com",
            content={"sheet": "next"},
            spread_id=self.campaign.obr_name,
        )
        next_sheet.created_at = reference_date + timedelta(days=4)
        next_sheet.save()

        ssi_for_campaign = SpreadSheetImport.objects.filter(spread_id=self.campaign.obr_name)
        snapshot = find_snapshot_for_date(ssi_for_campaign, self.round_1.started_at, 14, self.campaign.obr_name, 1)
        self.assertIsNone(snapshot)
