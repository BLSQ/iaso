import datetime

from django.utils import timezone
from django.utils.timezone import now
from rest_framework.status import HTTP_200_OK
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import (
    CampaignScope,
    Round,
    RoundScope,
    SubActivity,
    SubActivityScope,
)
from plugins.polio.models.base import CampaignType, ReasonForDelay
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


class UpdateCampaignAPITestCase(APITestCase, PolioTestCaseMixin):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = timezone.now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = polio_account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.user = cls.create_user_with_profile(
            username="yoda", account=polio_account, permissions=[CORE_FORMS_PERMISSION]
        )

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district")

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

        cls.user_no_permission = cls.create_user_with_profile(
            username="luke",
            account=polio_account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[cls.child_org_unit],
        )
        cls.initial_data = ReasonForDelay.objects.create(
            account=cls.account, key_name="INITIAL_DATA", name_en="Initial data", name_fr="Données initiales"
        )
        cls.cat_ate_my_homework = ReasonForDelay.objects.create(
            account=cls.account,
            key_name="CAT_ATE_MY_HOMEWORK",
            name_en="The cat ate my homework",
            name_fr="Mon chat a mangé mon devoir",
        )

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def test_campaign_scope_reduction_reflected_on_subactivities(self):
        # Create a new campaign with scope per campaign + subactivity scope
        test_campaign, round_1, _, _, _, district = self.create_campaign(
            obr_name="TEST_CAMPAIGN",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        subactivity_1 = SubActivity.objects.create(
            name="Test SubActivity",
            round=round_1,
            start_date=datetime.date(2022, 1, 1),
            end_date=datetime.date(2022, 1, 31),
        )
        campaign_group = m.Group.objects.create(name="campaign test group", source_version=self.source_version_1)
        org_units_list = [*self.org_units, district]
        campaign_group.org_units.set(org_units_list)
        campaign_scope = CampaignScope.objects.get(campaign=test_campaign, vaccine="mOPV2")
        campaign_scope.group = campaign_group
        campaign_scope.save()
        sub_activity_group = m.Group.objects.create(name="Test group", source_version=self.source_version_1)
        sub_activity_group.org_units.set(org_units_list)
        subactivity_scope = SubActivityScope.objects.create(
            subactivity=subactivity_1, group=sub_activity_group, vaccine="mOPV2"
        )
        # Get the campaign details to reuse payload for PUT request
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/campaigns/{test_campaign.id}/")
        data = self.assertJSONResponse(response, 200)
        response_group = data["scopes"][0]["group"]

        # Reduce scope
        new_scopes = [
            {
                "vaccine": data["scopes"][0]["vaccine"],
                "group": {
                    "name": response_group["name"],
                    "id": response_group["id"],
                    "org_units": [district.id],
                },
            }
        ]
        payload = {**data, "scopes": new_scopes}

        response = self.client.put(f"/api/polio/campaigns/{test_campaign.id}/", payload, format="json")
        data = self.assertJSONResponse(response, 200)
        # test campaign scope
        campaign_scope.refresh_from_db()
        self.assertEqual(campaign_scope.group.org_units.count(), 1)
        self.assertEqual(campaign_scope.group.org_units.first(), district)

        # test subactivity scope
        subactivity_scope.refresh_from_db()
        self.assertEqual(subactivity_scope.group.org_units.count(), 1)
        self.assertEqual(subactivity_scope.group.org_units.first(), district)

    def test_round_scope_reduction_reflected_on_subactivities(self):
        # Create a new campaign with scope per campaign + subactivity scope
        test_campaign, round_1, round_2, _, _, district = self.create_campaign(
            obr_name="TEST_CAMPAIGN",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        subactivity_1 = SubActivity.objects.create(
            name="Test SubActivity",
            round=round_1,
            start_date=datetime.date(2022, 1, 1),
            end_date=datetime.date(2022, 1, 31),
        )
        round_1_group = m.Group.objects.create(name="campaign test group", source_version=self.source_version_1)

        test_campaign.separate_scopes_per_round = True
        test_campaign.save()

        org_units_list = [*self.org_units, district]
        round_1_group.org_units.set(org_units_list)
        round_1_scope = RoundScope.objects.create(round=round_1, vaccine="mOPV2")
        round_1_scope.group = round_1_group
        round_1_scope.save()
        sub_activity_group = m.Group.objects.create(name="Test group", source_version=self.source_version_1)
        sub_activity_group.org_units.set(org_units_list)
        subactivity_scope = SubActivityScope.objects.create(
            subactivity=subactivity_1, group=sub_activity_group, vaccine="mOPV2"
        )
        # Get the campaign details to reuse payload for PUT request
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/campaigns/{test_campaign.id}/")
        data = self.assertJSONResponse(response, 200)
        response_group = data["rounds"][0]["scopes"][0]["group"]

        # Reduce scope
        new_scopes = [
            {
                "vaccine": data["rounds"][0]["scopes"][0]["vaccine"],
                "group": {
                    "name": response_group["name"],
                    "id": response_group["id"],
                    "org_units": [district.id],
                },
            }
        ]
        payload = {
            **data,
            "rounds": [{**data["rounds"][0], "scopes": new_scopes}, data["rounds"][1]],
        }

        response = self.client.put(f"/api/polio/campaigns/{test_campaign.id}/", payload, format="json")
        data = self.assertJSONResponse(response, 200)
        # test round scope
        round_1_scope.refresh_from_db()
        self.assertEqual(round_1_scope.group.org_units.count(), 1)
        self.assertEqual(round_1_scope.group.org_units.first(), district)

        # test subactivity scope
        subactivity_scope.refresh_from_db()
        self.assertEqual(subactivity_scope.group.org_units.count(), 1)
        self.assertEqual(subactivity_scope.group.org_units.first(), district)

    def test_changing_scope_type_deletes_old_scopes(self):
        # Switching to a campaign-level scope deletes all round-level scopes + subactivity scopes
        # Switching to a round-level scope deletes all campaign-level scopes + subactivity scopes

        # Create a new campaign with scope per campaign + subactivity scope
        test_campaign, round_1, round_2, _, _, district = self.create_campaign(
            obr_name="TEST_CAMPAIGN",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        subactivity_1 = SubActivity.objects.create(
            name="Test SubActivity",
            round=round_1,
            start_date=datetime.date(2022, 1, 1),
            end_date=datetime.date(2022, 1, 31),
        )
        group = m.Group.objects.create(name="Test group", source_version=self.source_version_1)
        group.org_units.add(district)
        subactivity_scope_with_campaign_level_scope = SubActivityScope.objects.create(
            subactivity=subactivity_1, group=group, vaccine="mOPV2"
        )

        # Test that separate_scopes_per_round is False and campaign has scope
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/campaigns/{test_campaign.id}/")
        data = self.assertJSONResponse(response, 200)
        self.assertFalse(data["separate_scopes_per_round"])
        self.assertEqual(len(data["scopes"]), 1)
        self.assertEqual(len(data["scopes"][0]["group"]["org_units"]), 1)
        for r in data["rounds"]:
            self.assertEqual(len(r["scopes"]), 0)

        old_payload = {**data}

        # Format payload for campaign with round level scope (only on round 1)
        new_round_1 = data["rounds"][0]
        new_round_1["scopes"] = data["scopes"]
        new_rounds = [new_round_1, data["rounds"][1], data["rounds"][2]]
        payload = {
            **data,
            "separate_scopes_per_round": True,
            "rounds": new_rounds,
            "description": "Yabadabadoo",
        }

        # Test that scope is on round and not on campaign
        response = self.client.put(f"/api/polio/campaigns/{test_campaign.id}/", payload, format="json")
        data = self.assertJSONResponse(response, 200)
        self.assertTrue(data["separate_scopes_per_round"])
        self.assertEqual(len(data["scopes"]), 0)
        self.assertEqual(len(data["rounds"][0]["scopes"]), 1)
        self.assertEqual(len(data["rounds"][0]["scopes"][0]["group"]["org_units"]), 1)
        self.assertEqual(data["description"], "Yabadabadoo")
        for index, r in enumerate(data["rounds"]):
            if index > 0:
                self.assertEqual(len(r["scopes"]), 0)

        # Check that the subactivity scope was also deleted
        with self.assertRaises(SubActivityScope.DoesNotExist):
            subactivity_scope_with_campaign_level_scope.refresh_from_db()

        # Let's create another subactivity scope for the second round
        subactivity_2 = SubActivity.objects.create(
            name="Test SubActivity 2",
            round=round_2,
            start_date=datetime.date(2022, 1, 1),
            end_date=datetime.date(2022, 1, 31),
        )
        subactivity_scope_with_round_level_scope = SubActivityScope.objects.create(
            subactivity=subactivity_2, group=group, vaccine="mOPV2"
        )

        # Switch scope back to campaign level
        response = self.client.put(f"/api/polio/campaigns/{test_campaign.id}/", old_payload, format="json")
        data = self.assertJSONResponse(response, 200)
        self.assertFalse(data["separate_scopes_per_round"])
        self.assertEqual(len(data["scopes"]), 1)
        self.assertEqual(len(data["scopes"][0]["group"]["org_units"]), 1)
        for r in data["rounds"]:
            self.assertEqual(len(r["scopes"]), 0)

        # Check that the new subactivity scope was again deleted
        with self.assertRaises(SubActivityScope.DoesNotExist):
            subactivity_scope_with_round_level_scope.refresh_from_db()

    def test_remove_round_deletes_round_in_DB(self):
        # Create a new campaign with scope per campaign
        test_campaign, _, _, _, _, _ = self.create_campaign(
            obr_name="TEST_CAMPAIGN",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )

        # Call API to get payload
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/polio/campaigns/{test_campaign.id}/")
        data = self.assertJSONResponse(response, 200)
        old_payload = {**data}
        rnds = old_payload["rounds"]
        # Keep the deleted round ddata so we can test against the ID
        rnd_to_delete = rnds.pop()
        # Format the paymoad to remove a round
        payload = {**old_payload, "rounds": rnds}

        response = self.client.put(f"/api/polio/campaigns/{test_campaign.id}/", payload, format="json")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(data["rounds"]), 2)
        self.assertIsNone(Round.objects.filter(id=rnd_to_delete["id"]).first())

    def test_can_update_campaign_with_orgunits_group(self):
        """
        Ensure we can update a campaign object with org units group
        """

        self.client.force_authenticate(self.user)

        self.client.post(
            "/api/polio/campaigns/",
            data={
                "obr_name": "campaign with org units",
                "scopes": [
                    {
                        "vaccine": "mOPV2",
                        "group": {"org_units": [self.org_units[0].id]},
                    },
                ],
            },
            format="json",
        )

        response = self.client.put(
            f"/api/polio/campaigns/{Campaign.objects.get().id!s}/",
            data={
                "account": self.account.pk,
                "obr_name": "campaign with org units",
                "scopes": [
                    {
                        "vaccine": "mOPV2",
                        "group": {
                            "org_units": list(map(lambda org_unit: org_unit.id, self.org_units)),
                        },
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertEqual(len(Campaign.objects.get().get_all_districts()), 3)

    def test_update_round_date_adds_history(self):
        """Updating round dates should add an entry in datelogs"""
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/polio/campaigns/",
            data={
                "obr_name": "campaign with org units",
                "rounds": [{"number": 1, "started_at": "2023-03-21", "ended_at": "2023-04-01"}],
            },
            format="json",
        )
        jr = self.assertJSONResponse(response, 201)
        campaign_id = jr["id"]
        datelogs = jr["rounds"][0]["datelogs"]
        new_datelog = {
            "previous_started_at": datelogs[0]["started_at"],
            "previous_ended_at": datelogs[0]["ended_at"],
            "started_at": datelogs[0]["started_at"],
            "ended_at": "2023-04-05",
            "reason_for_delay": self.cat_ate_my_homework.key_name,
        }
        datelogs.append(new_datelog)
        # Using PUT as it's how the UI proceeds
        response = self.client.put(
            f"/api/polio/campaigns/{campaign_id}/",
            data={
                "obr_name": "campaign with org units",
                "rounds": [
                    {
                        "number": 1,
                        "started_at": "2023-03-21",
                        "ended_at": "2023-04-05",
                        "datelogs": datelogs,
                    }
                ],
            },
            format="json",
        )
        jr = self.assertJSONResponse(response, 200)
        datelogs = jr["rounds"][0]["datelogs"]
        self.assertEqual(len(jr["rounds"][0]["datelogs"]), 2)
        self.assertEqual(jr["rounds"][0]["datelogs"][1]["reason_for_delay"], self.cat_ate_my_homework.key_name)
        self.assertEqual(jr["rounds"][0]["datelogs"][1]["ended_at"], "2023-04-05")
        self.assertEqual(jr["rounds"][0]["datelogs"][1]["previous_ended_at"], "2023-04-01")
        self.assertEqual(jr["rounds"][0]["datelogs"][1]["started_at"], "2023-03-21")
        self.assertEqual(jr["rounds"][0]["datelogs"][1]["previous_started_at"], "2023-03-21")

    def test_adding_a_new_round_should_generate_a_chronogram(self):
        """Adding a new round to a Polio campaign should generate a chronogram."""

        campaign = Campaign.objects.create(account=self.account, obr_name="obr_name")
        polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        campaign.campaign_types.add(polio_type)
        self.assertEqual(0, campaign.rounds.count())

        self.client.force_authenticate(self.user)

        # Add a round.
        response = self.client.put(
            f"/api/polio/campaigns/{campaign.id}/",
            data={
                "obr_name": campaign.obr_name,
                "rounds": [
                    {
                        "number": 1,
                        "started_at": now().date(),
                        "ended_at": (now() + datetime.timedelta(days=30)).date(),
                    }
                ],
            },
            format="json",
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertEqual(1, campaign.rounds.count())

        round = campaign.rounds.first()
        self.assertEqual(round.chronograms.valid().count(), 1)
        self.assertIsNone(round.chronograms.valid().first().created_by)
