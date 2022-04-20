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
        self.client.force_authenticate(self.yoda)

    def test_create_campaign(self):
        self.assertEqual(Campaign.objects.count(), 0)

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
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
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
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
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
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name")
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
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name")
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
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name")
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
        self.assertEqual(len(r["rounds"]), [])
