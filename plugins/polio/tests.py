import json
from unittest import mock

from django.utils.timezone import now
from rest_framework import status
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.test import APITestCase, TestCase
from .models import Campaign, Preparedness, Round
from .preparedness.calculator import get_preparedness_score
from .preparedness.exceptions import InvalidFormatError
from .preparedness.spreadsheet_manager import *


class PolioAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        account = Account.objects.create(name="Global Health Initiative", default_version=cls.source_version_1)
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

    @mock.patch("plugins.polio.serializers.get_national_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.get_regional_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.open_sheet_by_url", return_value={})
    def test_preview_preparedness(self, mock_open_sheet_by_url, *_):
        url = "https://docs.google.com/spreadsheets/d/1"
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        self.assertEqual(response.status_code, 200)
        mock_open_sheet_by_url.assert_called_with(url)

    @mock.patch("plugins.polio.serializers.get_national_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.get_regional_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.open_sheet_by_url", return_value={})
    def test_preview_invalid_document(self, mock_open_sheet_by_url, *_):
        url = "https://docs.google.com/spreadsheets/d/1"
        error_message = "Error test_preview_invalid_document"
        mock_open_sheet_by_url.side_effect = InvalidFormatError(error_message)
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        mock_open_sheet_by_url.assert_called_with(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get("non_field_errors"), [error_message])

    def test_create_campaign(self):
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "round_one": {},
            "round_two": {},
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Campaign.objects.count(), 1)

    def test_create_campaign_with_preparedness_data(self):
        self.assertEqual(Preparedness.objects.count(), 0)
        preparedness = {
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/1",
            "national_score": 10,
            "regional_score": 80,
            "district_score": 70,
            "payload": json.dumps({}),
        }

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "preparedness_data": preparedness,
            "round_one": {},
            "round_two": {},
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Preparedness.objects.count(), 1)

    def test_refresh_preparedness_data(self):
        self.assertEqual(Preparedness.objects.count(), 0)
        campaign = Campaign.objects.create(
            obr_name="obr_name",
            detection_status="PENDING",
            round_one=Round.objects.create(),
            round_two=Round.objects.create(),
        )

        preparedness = {
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/1",
            "national_score": 10,
            "regional_score": 80,
            "district_score": 70,
            "payload": json.dumps({}),
        }

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "preparedness_data": preparedness,
            "round_one": {},
            "round_two": {},
        }
        response = self.client.put(f"/api/polio/campaigns/{campaign.pk}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(campaign.preparedness_set.count(), 1)

    def test_add_group_to_existing_campaign_without_group(self):
        """
        Ensure a group will be created when updating an existing campaign without a group
        """
        campaign = Campaign.objects.create()

        response = self.client.put(
            f"/api/polio/campaigns/" + str(campaign.id) + "/",
            data={
                "round_one": {},
                "round_two": {},
                "obr_name": "campaign with org units",
                "group": {"name": "hidden group", "org_units": list(map(lambda org_unit: org_unit.id, self.org_units))},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        campaign.refresh_from_db()
        self.assertEqual(campaign.group.org_units.count(), self.org_units.__len__())

    def test_can_create_and_update_campaign_with_orgunits_group(self):
        """
        Ensure we can create a new campaign object with org units group
        """

        self.client.force_authenticate(self.yoda)

        response = self.client.post(
            f"/api/polio/campaigns/",
            data={
                "round_one": {},
                "round_two": {},
                "obr_name": "campaign with org units",
                "group": {"name": "hidden group", "org_units": [self.org_units[0].id]},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(Campaign.objects.get().obr_name, "campaign with org units")
        self.assertEqual(Campaign.objects.get().group.name, "hidden group")
        self.assertEqual(Campaign.objects.get().group.org_units.count(), 1)

        response = self.client.put(
            f"/api/polio/campaigns/" + str(Campaign.objects.get().id) + "/",
            data={
                "round_one": {},
                "round_two": {},
                "obr_name": "campaign with org units",
                "group": {"name": "hidden group", "org_units": list(map(lambda org_unit: org_unit.id, self.org_units))},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Campaign.objects.get().group.org_units.count(), 3)

    def test_can_only_see_campaigns_within_user_org_units_hierarchy(self):
        """
        Ensure a user can only see the campaigns for an org unit (or a descendent of that org unit) that was
        previously assigned to their profile
        """

        payload = {
            "obr_name": "obr_name a",
            "detection_status": "PENDING",
            "initial_org_unit": self.org_unit.pk,
            "round_one": {},
            "round_two": {},
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        payload = {
            "obr_name": "obr_name b",
            "detection_status": "PENDING",
            "initial_org_unit": self.child_org_unit.pk,
            "round_one": {},
            "round_two": {},
        }
        self.client.force_authenticate(self.luke)
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        response = self.client.get("/api/polio/campaigns/", format="json")

        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["initial_org_unit"], self.child_org_unit.pk)


class CampaignCalculatorTestCase(TestCase):
    def setUp(self) -> None:
        with open("./plugins/polio/preparedness/test_data/example1.json", "r") as json_data:
            self.preparedness_preview = json.load(json_data)

    def test_national_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertEqual(result["national_score"], 93)

    def test_regional_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertEqual(result["regional_score"], 68.4)

    def test_district_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertAlmostEqual(result["district_score"], 56.25)


class PreparednessSpreadsheetTestCase(TestCase):
    def test_get_range(self):
        self.assertEqual("A1:A5", get_range(1, 1, 5))
        self.assertEqual("A21:A25", get_range(1, 21, 25))
        self.assertEqual("C20:C50", get_range(3, 20, 50))
        self.assertEqual("G100:G150", get_range(7, 100, 150))

    def test_average_get_range(self):
        self.assertEqual('=AVERAGEIF(A1:A5,"<>NA")*0.1', get_average_of_range(1, 1, 5))
        self.assertEqual('=AVERAGEIF(A21:A25,"<>NA")*0.1', get_average_of_range(1, 21, 25))
        self.assertEqual('=AVERAGEIF(C20:C50,"<>NA")*0.1', get_average_of_range(3, 20, 50))
        self.assertEqual('=AVERAGEIF(G100:G150,"<>NA")*0.1', get_average_of_range(7, 100, 150))
