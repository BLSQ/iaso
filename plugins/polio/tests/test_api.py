import json
from unittest import mock

from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils.timezone import now
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.gis.geos import Polygon, Point, MultiPolygon

from iaso import models as m
from iaso.models import Account, OrgUnit
from iaso.test import APITestCase, TestCase

from plugins.polio.management.commands.weekly_email import send_notification_email
from ..models import Config, Round

from ..preparedness.calculator import get_preparedness_score
from ..preparedness.exceptions import InvalidFormatError
from ..preparedness.spreadsheet_manager import *


class PolioAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="test")
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_forms"])

        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc"),
            version=cls.source_version_1,
            name="Jedi Council A",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc"),
            version=cls.source_version_1,
            name="Sub Jedi Council A",
            parent_id=cls.org_unit.id,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_units = [
            cls.org_unit,
            cls.child_org_unit,
            m.OrgUnit.objects.create(
                org_unit_type=m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc"),
                version=cls.source_version_1,
                name="Jedi Council B",
                validation_status=m.OrgUnit.VALIDATION_VALID,
                source_ref="PvtAI4RUMkr",
            ),
        ]

        cls.luke = cls.create_user_with_profile(
            username="luke", account=account, permissions=["iaso_forms"], org_units=[cls.child_org_unit]
        )

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def test_campaings_list_authenticated(self):
        """Basic tests for the campaigns list endpoint (while authenticated)

        Checks
        - the endpoint exists
        - the status code
        - important data fields get returned
        """
        self.client.force_authenticate(self.yoda)
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")

        response = self.client.get("/api/polio/campaigns/")
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response), 2)

        for campaign_data in json_response:
            # Both are part of the same account
            self.assertEqual(campaign_data["account"], self.account.pk)
            # TODO: test other fields here

    def test_campaigns_list_anonymous(self):
        """Basic tests for the campaigns list endpoint (anonymous)

        Checks
        - the endpoint exists
        - the status code
        - important data fields get returned
        """
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")

        response = self.client.get("/api/polio/campaigns/")
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response), 2)

        for campaign_data in json_response:
            # Both are part of the same account
            self.assertEqual(campaign_data["account"], self.account.pk)
            # TODO: test other fields (all that's needed for anonymous access) here

    def test_create_campaign_account_mandatory(self):
        """Campaigns can't be created without an account"""
        self.client.force_authenticate(self.yoda)
        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 0,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(Campaign.objects.count(), 0)  # Nothing was created
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, b'{"account":["This field is required."]}')

    def test_create_campaign(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 0,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "obr_name")
        rounds = c.rounds.all()
        self.assertEqual(1, rounds.count())
        round_zero = rounds.first()
        self.assertEqual(round_zero.number, 0)
        response = self.client.get(f"/api/polio/campaigns/{c.id}/", payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 1)

    def test_create_campaign_with_round_one(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "obr_name")
        rounds = c.rounds.all()
        self.assertEqual(1, rounds.count())
        round_zero = rounds.first()
        self.assertEqual(round_zero.number, 1)
        response = self.client.get(f"/api/polio/campaigns/{c.id}/", payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertNotEqual(r["round_one"], None, r)
        # self.assertHasField(r["round_one"], "started_at", r)
        self.assertEqual(r["round_one"]["started_at"], "2021-02-01", r)
        self.assertEqual(len(r["rounds"]), 1)

    def test_create_campaign_with_round_one_and_two(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                },
                {
                    "number": 2,
                    "started_at": "2021-04-01",
                    "ended_at": "2021-04-20",
                },
            ],
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "obr_name")
        rounds = c.rounds.all().order_by("number")
        self.assertEqual(2, rounds.count())
        self.assertQuerysetEqual(rounds, [1, 2], lambda r: r.number)
        response = self.client.get(f"/api/polio/campaigns/{c.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertNotEqual(r["round_one"], None, r)
        # self.assertHasField(r["round_one"], "started_at", r)
        self.assertEqual(r["round_one"]["started_at"], "2021-02-01", r)
        self.assertEqual(len(r["rounds"]), 2)
        self.assertNotEqual(r["round_two"], None, r)
        self.assertEqual(r["round_two"]["started_at"], "2021-04-01", r)

    def test_patch_campaign(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name", account=self.account)
        Round.objects.create(number=1, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 1)

        payload = {
            "obr_name": "obr_name2",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                },
                {
                    "number": 2,
                    "started_at": "2021-04-01",
                    "ended_at": "2021-04-20",
                },
            ],
        }
        response = self.client.patch(f"/api/polio/campaigns/{campaign.id}/", payload, format="json")
        r = self.assertJSONResponse(response, 200)
        campaign.refresh_from_db()
        self.assertEqual(campaign.obr_name, "obr_name2")
        self.assertEqual(campaign.rounds.count(), 2, campaign.rounds)

    def test_patch_campaign_remove_round(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name", account=self.account)
        Round.objects.create(number=1, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        Round.objects.create(number=3, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        Round.objects.create(number=4, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 3)

        payload = {
            "obr_name": "obr_name2",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                },
                {
                    "number": 2,
                    "started_at": "2021-04-01",
                    "ended_at": "2021-04-20",
                },
            ],
        }
        response = self.client.patch(f"/api/polio/campaigns/{campaign.id}/", payload, format="json")
        r = self.assertJSONResponse(response, 200)
        campaign.refresh_from_db()
        self.assertEqual(campaign.obr_name, "obr_name2")
        rounds = campaign.rounds.all().order_by("number")
        self.assertEqual(2, rounds.count())
        self.assertQuerysetEqual(rounds, [1, 2], lambda r: r.number)

    def test_patch_campaign_remove_all_rounds(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name", account=self.account)
        Round.objects.create(number=1, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        Round.objects.create(number=3, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        Round.objects.create(number=4, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)
        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 3)

        payload = {
            "rounds": [],
        }
        response = self.client.patch(f"/api/polio/campaigns/{campaign.id}/", payload, format="json")
        r = self.assertJSONResponse(response, 200)
        campaign.refresh_from_db()
        rounds = campaign.rounds.all().order_by("number")
        self.assertEqual(0, rounds.count())
        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 0)

    def test_create_campaign_with_round_scopes(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                    "scopes": [
                        {"vaccine": "bOPV", "group": {"org_units": [self.org_unit.id]}},
                        {"vaccine": "mOPV2", "group": {"org_units": [self.child_org_unit.id]}},
                    ],
                },
                {
                    "number": 2,
                    "started_at": "2021-04-01",
                    "ended_at": "2021-04-20",
                },
            ],
        }

        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "obr_name")
        rounds = c.rounds.all().order_by("number")
        self.assertEqual(2, rounds.count())
        self.assertQuerysetEqual(rounds, [1, 2], lambda r: r.number)
        first_round = c.rounds.filter(number=1).first()
        self.assertQuerysetEqual(first_round.scopes.get(vaccine="bOPV").group.org_units.all(), [self.org_unit])
        self.assertQuerysetEqual(first_round.scopes.get(vaccine="mOPV2").group.org_units.all(), [self.child_org_unit])
        response = self.client.get(f"/api/polio/campaigns/{c.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertNotEqual(r["round_one"], None, r)
        # self.assertHasField(r["round_one"], "started_at", r)
        self.assertEqual(r["round_one"]["started_at"], "2021-02-01", r)
        self.assertEqual(len(r["rounds"]), 2)
        self.assertNotEqual(r["round_two"], None, r)
        self.assertEqual(r["round_two"]["started_at"], "2021-04-01", r)
        round_one = list(filter(lambda r: r["number"] == 1, r["rounds"]))[0]

        self.assertEqual(
            round_one["scopes"],
            [
                {
                    "vaccine": "bOPV",
                    "group": {
                        "name": "hidden roundScope",
                        "id": first_round.scopes.get(vaccine="bOPV").group.id,
                        "org_units": [o.id for o in first_round.scopes.get(vaccine="bOPV").group.org_units.all()],
                    },
                },
                {
                    "vaccine": "mOPV2",
                    "group": {
                        "name": "hidden roundScope",
                        "id": first_round.scopes.get(vaccine="mOPV2").group.id,
                        "org_units": [o.id for o in first_round.scopes.get(vaccine="mOPV2").group.org_units.all()],
                    },
                },
            ],
        )


class PreparednessAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.yoda = cls.create_user_with_profile(username="yoda", account=cls.account, permissions=["iaso_forms"])

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.yoda)

    def test_two_campaign_round(self):
        campaign_a = Campaign.objects.create(obr_name="campaign A", account=self.account)
        round_one = campaign_a.rounds.create(number=1)
        round_three = campaign_a.rounds.create(number=3)
        Campaign.objects.create(obr_name="campaign B", account=self.account)
        Campaign.objects.create(obr_name="campaign c", account=self.account)

        response = self.client.get(f"/api/polio/campaigns/{campaign_a.id}/", format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 2)

        response = self.client.get(f"/api/polio/preparedness_dashboard/", format="json")
        r = self.assertJSONResponse(response, 200)

        round_one.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_one.save()
        round_three.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_three.save()

        response = self.client.get(f"/api/polio/preparedness_dashboard/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        for round in r:
            self.assertEqual(round["status"], "not_sync")
        print(r)
