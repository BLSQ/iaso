from datetime import date

from django.contrib.auth.models import User, Permission
from django.utils.timezone import now
from rest_framework.test import APIClient

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import Account
from iaso.test import APITestCase
from ..models import Round
from ..preparedness.spreadsheet_manager import *


class PolioAPITestCase(APITestCase):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = polio_account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.yoda = cls.create_user_with_profile(username="yoda", account=polio_account, permissions=["iaso_forms"])

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
            username="luke", account=polio_account, permissions=["iaso_forms"], org_units=[cls.child_org_unit]
        )

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    # TODO: consider moving all campaigns list tests to their own classes (for tighter/smaller test classes)
    def test_campaings_list_authenticated(self):
        """Basic tests for the campaigns list endpoint (while authenticated)

        Checks
        - the endpoint exists
        - the status code
        - important data fields get returned
        """
        self.client.force_authenticate(self.yoda)
        yoda_account = self.yoda.iaso_profile.account
        Campaign.objects.create(account=yoda_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=yoda_account, obr_name="obr_name2", detection_status="PENDING")

        response = self.client.get("/api/polio/campaigns/")
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response), 2)

        for campaign_data in json_response:
            # Both are part of the same account
            self.assertEqual(campaign_data["account"], yoda_account.pk)
            # TODO: test other fields here

    def test_campaings_list_authenticated_only_get_own_account(self):
        """Campaigns list endpoint: authenticated users only see results linked to their account"""
        self.client.force_authenticate(self.yoda)
        yoda_account = self.yoda.iaso_profile.account

        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=yoda_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=yoda_account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(account=another_account, obr_name="obr_name_other_account", detection_status="PENDING")

        json_response = self.client.get("/api/polio/campaigns/").json()
        self.assertEqual(len(json_response), 2)
        self.assertNotIn("obr_name_other_account", [c["obr_name"] for c in json_response])

    def test_campaigns_list_anonymous_can_choose_account(self):
        """Campaigns list endpoint: anonymous users only can use the account_id parameter to filter"""
        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(account=another_account, obr_name="obr_name_other_account", detection_status="PENDING")

        json_response = self.client.get(f"/api/polio/campaigns/?account_id={another_account.pk}").json()
        self.assertEqual(len(json_response), 1)
        self.assertEqual(json_response[0]["obr_name"], "obr_name_other_account")

    def test_campaigns_list_anonymous_get_everything(self):
        """Campaigns list endpoint: if they don't use the account_id, anonymous users get everything"""
        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(account=another_account, obr_name="obr_name_other_account", detection_status="PENDING")

        json_response = self.client.get("/api/polio/campaigns/").json()
        self.assertEqual(len(json_response), 3)

    def test_campaings_list_authenticated_account_id_ignored(self):
        """Campaigns list endpoint: authenticated users cannot make use of the account_id parameter

        Notes:
            - This is a bit counterintuitive since anonymous users can BUT this is because more data fields are shown
            to authenticated users
            - in practice, no error is thrown but the account_id parameter just gets ignored
        """
        self.client.force_authenticate(self.yoda)
        yoda_account = self.yoda.iaso_profile.account

        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=yoda_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=yoda_account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(account=another_account, obr_name="obr_name_other_account", detection_status="PENDING")

        json_response = self.client.get(f"/api/polio/campaigns/?account_id={another_account.pk}").json()
        self.assertEqual(len(json_response), 2)
        self.assertNotIn("obr_name_other_account", [c["obr_name"] for c in json_response])

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

    def test_create_campaign_account_not_mandatory(self):
        """Campaigns ca be created without an account"""
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
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

    def test_cannot_create_campaigns_if_not_authenticated(self):
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
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Campaign.objects.count(), 0)

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
        self.assertJSONResponse(response, 200)
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
        self.assertJSONResponse(response, 200)
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
        self.assertJSONResponse(response, 200)
        campaign.refresh_from_db()
        rounds = campaign.rounds.all().order_by("number")
        self.assertEqual(0, rounds.count())
        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 0)

    def test_create_campaign_with_scopes(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name",
            "scopes": [
                {"vaccine": "bOPV", "group": {"org_units": [self.org_unit.id]}},
                {"vaccine": "mOPV2", "group": {"org_units": [self.child_org_unit.id]}},
            ],
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
        self.assertQuerysetEqual(c.scopes.get(vaccine="bOPV").group.org_units.all(), [self.org_unit])
        self.assertEqual(c.scopes.get(vaccine="bOPV").group.source_version, self.org_unit.version)
        self.assertQuerysetEqual(c.scopes.get(vaccine="mOPV2").group.org_units.all(), [self.child_org_unit])
        # check via the api
        response = self.client.get(f"/api/polio/campaigns/{c.id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertNotEqual(r["round_one"], None, r)
        # self.assertHasField(r["round_one"], "started_at", r)
        self.assertEqual(r["round_one"]["started_at"], "2021-02-01", r)
        self.assertEqual(len(r["rounds"]), 2)
        self.assertNotEqual(r["round_two"], None, r)
        self.assertEqual(r["round_two"]["started_at"], "2021-04-01", r)

        scope_bOPV = c.scopes.get(vaccine="bOPV")
        scope_mOPV2 = c.scopes.get(vaccine="mOPV2")
        self.assertEqual(
            r["scopes"],
            [
                {
                    "vaccine": "bOPV",
                    "group": {
                        "name": scope_bOPV.group.name,
                        "id": scope_bOPV.group.id,
                        "org_units": [o.id for o in scope_bOPV.group.org_units.all()],
                    },
                },
                {
                    "vaccine": "mOPV2",
                    "group": {
                        "name": scope_mOPV2.group.name,
                        "id": scope_mOPV2.group.id,
                        "org_units": [o.id for o in scope_mOPV2.group.org_units.all()],
                    },
                },
            ],
        )

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
                        "name": "scope for round 1 campaign obr_name - bOPV",
                        "id": first_round.scopes.get(vaccine="bOPV").group.id,
                        "org_units": [o.id for o in first_round.scopes.get(vaccine="bOPV").group.org_units.all()],
                    },
                },
                {
                    "vaccine": "mOPV2",
                    "group": {
                        "name": "scope for round 1 campaign obr_name - mOPV2",
                        "id": first_round.scopes.get(vaccine="mOPV2").group.id,
                        "org_units": [o.id for o in first_round.scopes.get(vaccine="mOPV2").group.org_units.all()],
                    },
                },
            ],
        )

    def test_update_campaign_with_vaccine_data(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)
        campaign = Campaign.objects.create(obr_name="obr_name", account=self.account)
        Round.objects.create(number=1, started_at="2021-01-01", ended_at="2021-01-20", campaign=campaign)

        payload = {
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2022-11-08",
                    "ended_at": "2022-11-10",
                    "vaccines": [{"name": "mOPV2", "wastage_ratio_forecast": 1.15, "doses_per_vial": 50}],
                    "reporting_delays_hc_to_district": 3,
                    "reporting_delays_district_to_region": 5,
                    "reporting_delays_region_to_national": 7,
                    "destructions": [
                        {"date_report_received": "2022-11-09", "date_report": "2022-11-09", "vials_destroyed": "1"}
                    ],
                }
            ],
            "scopes": [],
            "group": {"name": "hidden group", "org_units": []},
            "is_preventive": False,
            "is_test": False,
            "enable_send_weekly_email": True,
            "obr_name": "hello",
            "grouped_campaigns": [],
        }

        response = self.client.patch(f"/api/polio/campaigns/{campaign.id}/", payload, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(Modification.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "hello")
        self.assertEqual(c.rounds.count(), 1)

        round = c.rounds.first()
        self.assertEqual(round.started_at, date(2022, 11, 8))
        self.assertEqual(round.ended_at, date(2022, 11, 10))
        self.assertEqual(round.vaccines.count(), 1)
        self.assertEqual(round.destructions.count(), 1)
        self.assertEqual(round.shipments.count(), 0)

        # update again

        payload2 = {
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2022-11-08",
                    "ended_at": "2022-11-10",
                    "vaccines": [{"name": "mOPV2", "wastage_ratio_forecast": 1.15, "doses_per_vial": 50}],
                    "reporting_delays_hc_to_district": 3,
                    "reporting_delays_district_to_region": 5,
                    "reporting_delays_region_to_national": 7,
                    "destructions": [],
                    "shipments": [
                        {
                            "vaccine_name": "mOPV2",
                            "po_numbers": "2",
                            "vials_received": "2",
                            "reception_pre_alert": "2022-11-09",
                            "estimated_arrival_date": "2022-11-16",
                            "date_reception": "2022-11-09",
                        }
                    ],
                }
            ],
            "scopes": [],
            "group": {"name": "hidden group", "org_units": []},
            "is_preventive": False,
            "is_test": False,
            "enable_send_weekly_email": True,
            "obr_name": "hello",
            "grouped_campaigns": [],
        }

        response = self.client.patch(f"/api/polio/campaigns/{campaign.id}/", payload2, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(Modification.objects.count(), 2)
        c = Campaign.objects.first()
        self.assertEqual(c.rounds.count(), 1)

        round = c.rounds.first()
        self.assertEqual(round.started_at, date(2022, 11, 8))
        self.assertEqual(round.ended_at, date(2022, 11, 10))
        self.assertEqual(round.vaccines.count(), 1)
        self.assertEqual(round.destructions.count(), 0)
        self.assertEqual(round.shipments.count(), 1)

    def test_create_campaign_with_vaccine_data(self):
        self.client.force_authenticate(self.yoda)
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2022-11-08",
                    "ended_at": "2022-11-10",
                    "vaccines": [{"name": "mOPV2", "wastage_ratio_forecast": 1.15, "doses_per_vial": 50}],
                    "reporting_delays_hc_to_district": 3,
                    "reporting_delays_district_to_region": 5,
                    "reporting_delays_region_to_national": 7,
                    "destructions": [
                        {"date_report_received": "2022-11-09", "date_report": "2022-11-09", "vials_destroyed": "1"}
                    ],
                }
            ],
            "scopes": [],
            "group": {"name": "hidden group", "org_units": []},
            "is_preventive": False,
            "is_test": False,
            "enable_send_weekly_email": True,
            "obr_name": "hello",
            "grouped_campaigns": [],
        }

        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Campaign.objects.count(), 1)
        c = Campaign.objects.first()
        self.assertEqual(c.obr_name, "hello")
        self.assertEqual(c.rounds.count(), 1)

        round = c.rounds.first()
        self.assertEqual(round.vaccines.count(), 1)
        self.assertEqual(round.destructions.count(), 1)
        self.assertEqual(round.shipments.count(), 0)


class PreparednessAPITestCase(APITestCase):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    account: Account

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

    def test_two_campaign_round_empty(self):
        campaign_a = Campaign.objects.create(obr_name="campaign A", account=self.account)
        campaign_a.rounds.create(number=1)
        campaign_a.rounds.create(number=3)
        Campaign.objects.create(obr_name="campaign B", account=self.account)
        Campaign.objects.create(obr_name="campaign c", account=self.account)

        response = self.client.get(f"/api/polio/campaigns/{campaign_a.id}/", format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 2)

        response = self.client.get(f"/api/polio/preparedness_dashboard/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 0)

    def test_two_campaign_round_error(self):
        campaign_a = Campaign.objects.create(obr_name="campaign A", account=self.account)
        round_one = campaign_a.rounds.create(number=1)
        round_three = campaign_a.rounds.create(number=3)
        Campaign.objects.create(obr_name="campaign B", account=self.account)
        Campaign.objects.create(obr_name="campaign c", account=self.account)

        response = self.client.get(f"/api/polio/campaigns/{campaign_a.id}/", format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["rounds"]), 2)

        round_one.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_one.save()
        round_three.preparedness_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1"
        round_three.save()

        response = self.client.get(f"/api/polio/preparedness_dashboard/", format="json")
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


class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]
    c: Campaign
    user: User
    country: OrgUnit
    country2: OrgUnit

    @classmethod
    def setUpTestData(cls) -> None:
        cls.user = User.objects.get(username="test")
        cls.country = OrgUnit.objects.create(name="Country A")
        cls.country2 = OrgUnit.objects.create(name="Country B")

        cls.c = Campaign.objects.create(
            obr_name="test campaign", account=cls.user.iaso_profile.account, country=cls.country
        )

    def test_audit_list(self):
        """Mod a campaign, user can see modification. Limit to another country modification cannot be listed anymore
        Give access to country in campaign , they can be listed again
        """
        self.client.force_authenticate(self.user)
        self.assertEqual(self.user.is_superuser, False)
        self.user.user_permissions.add(Permission.objects.get(codename="iaso_polio"))

        payload = {"obr_name": "test2"}
        response = self.client.patch(f"/api/polio/campaigns/{self.c.id}/", payload, format="json")
        self.assertJSONResponse(response, 200)

        self.assertEqual(Modification.objects.count(), 1)
        response = self.client.get(f"/api/logs/?objectId={self.c.id}&contentType=polio.campaign&limit=10")
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["list"]), 1)

        # limit user to the other country. Cannot list
        p = self.user.iaso_profile
        p.org_units.set([self.country2])
        p.save()
        response = self.client.get(f"/api/logs/?objectId={self.c.id}&contentType=polio.campaign&limit=10")
        j = self.assertJSONResponse(response, 401)
        self.assertEqual(j, {"error": "Unauthorized"})

        # limit user to the other country. Cannot list
        p = self.user.iaso_profile
        p.org_units.set([self.c.country])
        p.save()
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/logs/?objectId={self.c.id}&contentType=polio.campaign&limit=10")
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["list"]), 1)
