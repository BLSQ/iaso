import datetime
import json
import os
import pandas as pd
import pprint
import io
from typing import List
from unittest import mock
from unittest.mock import patch

import jwt  # type: ignore
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils.timezone import now
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.gis.geos import Polygon, Point, MultiPolygon

from hat.api.token_authentication import generate_auto_authentication_link
from hat.settings import BASE_DIR
from iaso import models as m
from iaso.models import Account, OrgUnit, org_unit, OrgUnitType
from iaso.models.microplanning import Team
from iaso.test import APITestCase, TestCase

from plugins.polio.management.commands.weekly_email import send_notification_email
from ..api import CACHE_VERSION
from ..models import Config, BudgetEvent, BudgetFiles, CampaignFormTemplate, Round

from ..preparedness.calculator import get_preparedness_score
from ..preparedness.exceptions import InvalidFormatError
from ..preparedness.spreadsheet_manager import *
from ..serializers import CampaignSerializer
from ..export_utils import format_date


class PolioAPITestCase(APITestCase):
    data_source: m.DataSource
    now: datetime.datetime
    source_version_1: m.SourceVersion
    source_version_2: m.SourceVersion
    star_wars: m.Account
    jedi_squad: m.OrgUnitType
    yoda: User
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit
    org_units: List[m.OrgUnit]
    luke: User

    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = m.DataSource.objects.create(name="Default source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)
        cls.star_wars = m.Account.objects.create(name="Star Wars")
        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
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

    def setUp(self) -> None:
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.yoda)

    @mock.patch("plugins.polio.serializers.SpreadSheetImport")
    def test_preview_invalid_document(self, mock_SpreadSheetImport, *_):
        mock_SpreadSheetImport.create_for_url.return_value = mock.MagicMock()
        url = "https://docs.google.com/spreadsheets/d/1"
        error_message = "Error test_preview_invalid_document"
        mock_SpreadSheetImport.create_for_url.side_effect = InvalidFormatError(error_message)
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        mock_SpreadSheetImport.create_for_url.assert_called_with(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get("non_field_errors"), [error_message])

    def test_create_campaign(self):
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {"obr_name": "obr_name", "detection_status": "PENDING", "rounds": []}
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertJSONResponse(response, 201)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Campaign.objects.count(), 1)

    def test_return_test_campaign_only(self):
        self.assertEqual(Campaign.objects.count(), 0)

        payload1 = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "is_test": True,
        }
        self.client.post("/api/polio/campaigns/", payload1, format="json")

        payload2 = {
            "obr_name": "obr_name_1",
            "detection_status": "PENDING",
            "is_test": False,
        }
        self.client.post("/api/polio/campaigns/", payload2, format="json")

        response = self.client.get("/api/polio/campaigns/?is_test=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_add_group_to_existing_campaign_without_group(self):
        """
        Ensure a group will be created when updating an existing campaign without a group
        """
        campaign = Campaign.objects.create()

        response = self.client.patch(
            f"/api/polio/campaigns/" + str(campaign.id) + "/",
            data={
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
        self.assertJSONResponse(response, status.HTTP_200_OK)

        campaign.refresh_from_db()
        self.assertEqual(campaign.get_all_districts().count(), self.org_units.__len__())

    def test_can_create_and_update_campaign_with_orgunits_group(self):
        """
        Ensure we can create a new campaign object with org units group
        """

        self.client.force_authenticate(self.yoda)

        response = self.client.post(
            f"/api/polio/campaigns/",
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

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(Campaign.objects.get().obr_name, "campaign with org units")
        self.assertEqual(Campaign.objects.get().scopes.first().group.org_units.count(), 1)

        response = self.client.put(
            f"/api/polio/campaigns/" + str(Campaign.objects.get().id) + "/",
            data={
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

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Campaign.objects.get().get_all_districts().count(), 3)

    def test_can_only_see_campaigns_within_user_org_units_hierarchy(self):
        """
        Ensure a user can only see the campaigns for an org unit (or a descendent of that org unit) that was
        previously assigned to their profile
        """

        payload = {
            "obr_name": "obr_name a",
            "detection_status": "PENDING",
            "initial_org_unit": self.org_unit.pk,
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        payload = {
            "obr_name": "obr_name b",
            "detection_status": "PENDING",
            "initial_org_unit": self.child_org_unit.pk,
        }
        self.client.force_authenticate(self.luke)
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        response = self.client.get("/api/polio/campaigns/", format="json")

        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["initial_org_unit"], self.child_org_unit.pk)

    def test_polio_campaign_soft_delete(self):
        campaign = Campaign(obr_name="test_soft_delete", detection_status="PENDING")
        campaign.save()
        campaign.delete()
        last_campaign = Campaign.objects.last()
        self.assertEqual(last_campaign, campaign)

    def test_soft_deleted_campaign_weekly_mail(self):
        campaign_deleted = Campaign(
            obr_name="deleted_campaign", detection_status="PENDING", virus="ABC", country=self.org_unit, onset_at=now()
        )

        campaign_active = Campaign(
            obr_name="active campaign", detection_status="PENDING", virus="ABC", country=self.org_unit, onset_at=now()
        )

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        self.luke.email = "luketest@lukepoliotest.io"
        self.luke.save()

        campaign_deleted.save()
        campaign_deleted.delete()
        campaign_active.save()

        self.assertEqual(send_notification_email(campaign_deleted), False)
        self.assertEqual(send_notification_email(campaign_active), True)

    def create_multiple_campaigns(self, count: int):
        for n in range(count):
            payload = {
                "obr_name": "campaign_{0}".format(n),
                "detection_status": "PENDING",
            }
            self.client.post("/api/polio/campaigns/", payload, format="json")

    def test_return_only_deleted_campaigns(self):

        self.create_multiple_campaigns(10)

        campaigns = Campaign.objects.all()

        for c in campaigns[:8]:
            self.client.delete("/api/polio/campaigns/{0}/".format(c.id))

        response = self.client.get("/api/polio/campaigns/?deletion_status=deleted", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 8)

        # test that it return all
        response = self.client.get("/api/polio/campaigns/?deletion_status=all", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 10)

        # per defaut it return undeleted
        response = self.client.get("/api/polio/campaigns/", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

        # filter on active
        response = self.client.get("/api/polio/campaigns/?deletion_status=active", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_return_only_active_campaigns(self):

        self.create_multiple_campaigns(3)

        campaigns = Campaign.objects.all()

        for c in campaigns[:2]:
            self.client.delete("/api/polio/campaigns/{0}/".format(c.id))

        response = self.client.get("/api/polio/campaigns/?campaigns=active", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_restore_deleted_campaign(self):
        self.create_multiple_campaigns(1)
        campaign = Campaign.objects.get()

        payload = {"id": campaign.id}

        if campaign.deleted_at is None:
            self.client.delete("/api/polio/campaigns/{0}/".format(campaign.id))
            self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")

        restored_campaign = Campaign.objects.get(id=campaign.id)
        self.assertIsNone(restored_campaign.deleted_at)

    def test_create_calendar_xlsx_sheet(self):
        """
        It tests the whole export XLSX calendar feature when everything happens correctly:
            1. If the export succeed
            2. If it return the right header
            3. If the columns names are correct
            4. If the data in cells are correct:
                a. If there is on rounds in a cell
                b. If there are two rounds in a cell(it can be more than two rounds)
        """
        org_unit = OrgUnit.objects.create(
            id=5455,
            name="Country name",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        org_unit_2 = OrgUnit.objects.create(
            id=5456,
            name="Country name 2",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", vacine="vacin")
        c_round_1 = c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))
        c_round_2 = c.rounds.create(number=2, started_at=datetime.date(2022, 3, 1), ended_at=datetime.date(2022, 3, 2))

        c2 = Campaign.objects.create(country_id=org_unit_2.id, obr_name="orb campaign 2", vacine="vacin")
        c2_round_1 = c2.rounds.create(
            number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2)
        )
        c2_round_2 = c2.rounds.create(
            number=2, started_at=datetime.date(2022, 1, 4), ended_at=datetime.date(2022, 1, 7)
        )
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=calendar_2022-10-01.xlsx")
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name="calendar_2022-10-01")

        excel_columns = excel_data.columns.ravel()
        self.assertEqual(excel_columns[0], "COUNTRY")
        self.assertEqual(excel_columns[3], "March")

        data_dict = excel_data.to_dict()
        self.assertEqual(data_dict["COUNTRY"][0], org_unit.name)
        self.assertEqual(data_dict["COUNTRY"][1], org_unit_2.name)
        self.assertEqual(data_dict["January"][0], self.format_date_to_test(c, c_round_1))
        self.assertEqual(data_dict["January"][1], self.format_date_to_test(c2, c2_round_1))
        self.assertEqual(data_dict["January"][2], self.format_date_to_test(c2, c2_round_2))
        #  + self.format_date_to_test(c2, c2_round_2)

    def test_create_calendar_xlsx_sheet_campaign_without_country(self):
        """
        When a campaign was not linked to a country, export XLSX calendar triggered an error('NoneType' object has no attribute 'id'):
            - This test checks if the error does not occur even when a campaign is not linked to country
        """
        c = Campaign.objects.create(obr_name="orb campaign", vacine="vacin")
        c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))

        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name="calendar_2022-10-01")

        data_dict = excel_data.to_dict()
        self.assertEqual(len(data_dict["COUNTRY"]), 0)

    def test_create_calendar_xlsx_sheet_round_with_no_end_date(self):
        """
        When a round had None in started_at or ended_at, it triggered an error('time data '' does not match format '%Y-%m-%d''):
            - This test checks if the error does not occur even when a round has None in started_at or ended_at
        """
        org_unit = OrgUnit.objects.create(
            id=5455,
            name="Country name",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", vacine="vacin")
        round = c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=None)

        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name="calendar_2022-10-01")

        data_dict = excel_data.to_dict()
        self.assertEqual(data_dict["January"][0], self.format_date_to_test(c, round))

    def test_create_calendar_xlsx_sheet_without_test_campaigns(self):
        """
        Test campaigns appeared in the XLSX but they should not
            - This test is to make sure that no test campaign appear again in the XLSX calendar export
        """
        org_unit = OrgUnit.objects.create(
            id=5455,
            name="Country name",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )
        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", vacine="vacin", is_test=True)
        c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))

        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name="calendar_2022-10-01")

        data_dict = excel_data.to_dict()
        self.assertEqual(len(data_dict["COUNTRY"]), 0)

    @staticmethod
    def format_date_to_test(campaign, round):
        started_at = format_date(round.started_at.strftime("%Y-%m-%d")) if round.started_at is not None else ""
        ended_at = format_date(round.ended_at.strftime("%Y-%m-%d"), True) if round.ended_at is not None else ""
        return (
            campaign.obr_name
            + "\nRound "
            + str(round.number)
            + "\nDates: "
            + started_at
            + " - "
            + ended_at
            + "\n"
            + campaign.vacine
        )

    def test_handle_restore_active_campaign(self):
        self.create_multiple_campaigns(1)
        campaign = Campaign.objects.get()

        payload = {"id": campaign.id}

        response = self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_handle_non_existant_campaign(self):

        payload = {"id": "bd656a6b-f67e-4a1e-95ee-1bef8f36239a"}
        response = self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 404)

    def tesst_export_campaign_as_xlsform(self):
        pass

    def test_export_campaign_xls_form(self):
        self.client.force_authenticate(self.yoda)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        CampaignFormTemplate.objects.create(
            name="A_FORM_1", account=self.yoda.iaso_profile.account, form_template=upload_file
        )

        round = Round.objects.create(started_at=datetime.datetime.now())
        campaign = Campaign.objects.create(round_one=round)

        self.client.patch(
            f"/api/polio/campaigns/" + str(campaign.id) + "/",
            data={
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
        campaign.refresh_from_db()

        response = self.client.get(f"/api/polio/campaigns/generate_xlsform/?id={campaign.id}&form_name=A_FORM_1")
        date_now = datetime.datetime.today().strftime("%Y-%m-%d")

        self.assertEqual(response.status_code, 200)
        self.assertEquals(
            response.get("Content-Disposition"), f"attachment; filename=FORM_campaign with org units_{date_now}.xlsx"
        )

    def test_export_campaign_xls_form_without_round(self):
        self.client.force_authenticate(self.yoda)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        CampaignFormTemplate.objects.create(
            name="A_FORM_1", account=self.yoda.iaso_profile.account, form_template=upload_file
        )

        campaign = Campaign.objects.create()

        self.client.patch(
            f"/api/polio/campaigns/" + str(campaign.id) + "/",
            data={
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
        campaign.refresh_from_db()

        response = self.client.get(f"/api/polio/campaigns/generate_xlsform/?id={campaign.id}&form_name=A_FORM_1")
        date_now = datetime.datetime.today().strftime("%Y-%m-%d")

        self.assertEqual(response.status_code, 200)
        self.assertEquals(
            response.get("Content-Disposition"), f"attachment; filename=FORM_campaign with org units_{date_now}.xlsx"
        )


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


class LQASIMPolioTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.luke = cls.create_user_with_profile(
            username="luke", account=star_wars, permissions=["iaso_org_units"], org_units=[cls.jedi_council_endor]
        )
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

    def test_lqas_stats_response(self):

        self.client.force_authenticate(self.yoda)

        Config.objects.create(
            slug="lqas-config",
            content=[{"country_id": 29709}, {"country_id": 29694}, {"country_id": 29729}, {"country_id": 29728}],
        )

        lqas_conf = Config.objects.get(slug="lqas-config")

        for config in lqas_conf.content:
            OrgUnit.objects.create(
                id=config["country_id"],
                name="heyz",
                org_unit_type=self.jedi_squad,
                version=self.star_wars.default_version,
            )

        response = self.client.get("/api/polio/lqasstats/?country_id=29729")

        self.assertEqual(response.status_code, 200)

    def test_lqas_stats_response_is_cached(self):

        self.client.force_authenticate(self.yoda)

        Config.objects.create(
            slug="lqas-config",
            content=[{"country_id": 29709}, {"country_id": 29694}, {"country_id": 29729}, {"country_id": 29728}],
        )

        lqas_conf = Config.objects.get(slug="lqas-config")

        for config in lqas_conf.content:
            OrgUnit.objects.create(
                id=config["country_id"],
                name="heyz",
                org_unit_type=self.jedi_squad,
                version=self.star_wars.default_version,
            )

        response = self.client.get("/api/polio/lqasstats/?country_id=29729")

        is_cached = True if cache.get("{0}-{1}-LQAS".format(self.yoda.pk, 29729), version=CACHE_VERSION) else False

        self.assertEqual(response.status_code, 200)
        self.assertEqual(is_cached, True)

    def test_IM_stats_response(self):

        self.client.force_authenticate(self.yoda)

        Config.objects.create(
            slug="im-config",
            content=[{"country_id": 29709}, {"country_id": 29694}, {"country_id": 29729}, {"country_id": 29728}],
        )

        im_conf = Config.objects.get(slug="im-config")

        for config in im_conf.content:
            OrgUnit.objects.create(
                id=config["country_id"],
                name="heyz",
                org_unit_type=self.jedi_squad,
                version=self.star_wars.default_version,
            )

        response = self.client.get("/api/polio/imstats/?country_id=29729")

        self.assertEqual(response.status_code, 200)

    def test_IM_stats_response_is_cached(self):

        self.client.force_authenticate(self.yoda)

        Config.objects.create(
            slug="im-config",
            content=[{"country_id": 29709}, {"country_id": 29694}, {"country_id": 29729}, {"country_id": 29728}],
        )

        im_conf = Config.objects.get(slug="im-config")

        for config in im_conf.content:
            OrgUnit.objects.create(
                id=config["country_id"],
                name="heyz",
                org_unit_type=self.jedi_squad,
                version=self.star_wars.default_version,
            )

        response = self.client.get("/api/polio/imstats/?country_id=29729")

        is_cached = True if cache.get("{0}-{1}-IM".format(self.yoda.pk, 29729), version=CACHE_VERSION) else False

        self.assertEqual(response.status_code, 200)
        self.assertEqual(is_cached, True)

    def test_shapes_resp_is_cached(self):

        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/polio/campaigns/merged_shapes.geojson/")

        is_cached = True if cache.get("{0}-geo_shapes".format(self.yoda.id), version=CACHE_VERSION) else False

        self.assertEqual(response.status_code, 200)
        self.assertEqual(is_cached, True)

    def test_general_status(self):
        c = Campaign.objects.create()
        c.rounds.create(number=1, started_at=datetime.date(2021, 1, 1), ended_at=datetime.date(2021, 1, 2))
        c.rounds.create(number=2, started_at=datetime.date(2021, 3, 1), ended_at=datetime.date(2021, 3, 2))
        c.rounds.create(number=3, started_at=datetime.date(2021, 4, 1), ended_at=datetime.date(2021, 4, 20))

        with patch("django.utils.timezone.now", lambda: datetime.datetime(2020, 2, 2, 2, 2, 2)):
            d = CampaignSerializer(instance=c).data
            self.assertEqual(d["general_status"], "Preparing")
        with patch("django.utils.timezone.now", lambda: datetime.datetime(2021, 1, 1, 2, 2, 2)):
            d = CampaignSerializer(instance=c).data
            self.assertEqual(d["general_status"], "Round 1 started")
        with patch("django.utils.timezone.now", lambda: datetime.datetime(2021, 1, 3, 10, 2, 2)):
            d = CampaignSerializer(instance=c).data
            self.assertEqual(d["general_status"], "Round 1 ended")
        with patch("django.utils.timezone.now", lambda: datetime.datetime(2021, 4, 20, 10, 2, 2)):
            d = CampaignSerializer(instance=c).data
            self.assertEqual(d["general_status"], "Round 3 started")


class BudgetPolioTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        account = Account.objects.create(name="Global Health Initiative", default_version=cls.source_version_1)
        second_account = Account.objects.create(name="WHO", default_version=cls.source_version_1)

        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_polio_budget"])
        cls.grogu = cls.create_user_with_profile(
            username="Grogu", account=second_account, permissions=["iaso_polio_budget"]
        )

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

        cls.campaign_test = Campaign.objects.create(
            obr_name="obr_name", detection_status="PENDING", country=cls.org_unit
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=cls.yoda)
        cls.team1.users.set([cls.yoda.iaso_profile.user_id])
        cls.team2 = Team.objects.create(project=project1, name="team2", manager=cls.grogu)
        cls.approval_team = Team.objects.create(project=project1, name="approval team", manager=cls.yoda)
        cls.approval_team.users.set([cls.yoda.iaso_profile.user_id])

    def test_create_polio_budget(self):
        self.client.force_authenticate(self.yoda)

        data = {
            "campaign": self.campaign_test.pk,
            "type": "submission",
            "target_teams": [self.team1.pk],
            "status": "validation_ongoing",
        }

        response = self.client.post("/api/polio/budgetevent/", data=data, format="json")

        budget_events = BudgetEvent.objects.all()

        budget_event = BudgetEvent.objects.last()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(1, len(budget_events))
        self.assertEqual(budget_event.author, self.yoda)
        self.assertEqual(budget_event.status, "validation_ongoing")
        self.assertEqual(budget_event.type, "submission")
        self.assertEqual(budget_event.campaign, self.campaign_test)

    def test_budgets_are_multi_tenancy(self):
        self.client.force_authenticate(self.yoda)

        budget = BudgetEvent.objects.create(
            campaign=self.campaign_test, type="submission", author=self.grogu, status="validation_ongoing"
        )

        budget.target_teams.set([self.team1])
        budget.save()

        response = self.client.get("/api/polio/budgetevent/")

        budget_events = BudgetEvent.objects.all()

        self.assertEqual(len(response.data), 0)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(budget_events), 1)

    def test_budget_upload_file(self):
        self.client.force_authenticate(self.grogu)

        budget = BudgetEvent.objects.create(
            campaign=self.campaign_test, type="submission", author=self.grogu, status="validation_ongoing"
        )

        budget.target_teams.set([self.team1])
        budget.save()

        data = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))
        upload_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", data.read(), content_type="multipart/form-data"
        )

        payload = {
            "event": budget.pk,
            "file": upload_file,
            "cc_emails": "lil_grogu@mandalorians.com, master_yoda@jedi.force",
        }

        response = self.client.post(
            "/api/polio/budgetfiles/",
            data=payload,
            content_disposition="attachment; filename=test_user_bulk_create_valid.csv",
        )

        budget_files = BudgetFiles.objects.all()
        budget_event = BudgetEvent.objects.all()

        self.assertEqual(len(budget_event), 1)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(budget_files), 1)

    def test_finalize_budget(self):
        self.client.force_authenticate(self.grogu)

        budget = BudgetEvent.objects.create(
            campaign=self.campaign_test, type="submission", author=self.yoda, status="validation_ongoing"
        )

        budget.target_teams.set([self.team1])
        budget.save()

        data = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))
        upload_file = SimpleUploadedFile(
            "test_user_bulk_create_valid.csv", data.read(), content_type="multipart/form-data"
        )

        payload = {
            "event": budget.pk,
            "file": upload_file,
            "cc_emails": "lil_grogu@mandalorians.com, master_yoda@jedi.force",
        }

        response = self.client.post(
            "/api/polio/budgetfiles/",
            data=payload,
            content_disposition="attachment; filename=test_user_bulk_create_valid.csv",
        )

        data_finalize = {
            "event": budget.pk,
            "is_finalized": "true",
        }

        response_f = self.client.put("/api/polio/budgetevent/confirm_budget/", data=data_finalize, format="json")

        budget = BudgetEvent.objects.get(pk=budget.pk)

        print(response_f.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_f.status_code, 200)
        self.assertEqual(budget.is_finalized, True)
        self.assertEqual(budget.is_email_sent, True)

    def test_authentication_link_token(self):
        link = "testbluesquarestuff.com"
        final_link = generate_auto_authentication_link(link, self.grogu)

        token = final_link[final_link.find("token=") + 6 : final_link.find("next=")][:-1]
        decoded_token = jwt.decode(token, verify=False)

        user_id_from_token = decoded_token["user_id"]
        token_type = decoded_token["token_type"]

        self.assertEqual(self.grogu.pk, user_id_from_token)
        self.assertEqual(token_type, "access")
        self.assertEqual(link, final_link[final_link.find("next=") + 5 :])


class CampaignFormTemplateTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        account = Account.objects.create(name="Global Health Initiative", default_version=cls.source_version_1)
        second_account = Account.objects.create(name="WHO", default_version=cls.source_version_1)

        cls.lucy = cls.create_user_with_profile(username="lucy", account=account)
        cls.rebecca = cls.create_user_with_profile(username="rebecca", account=second_account)

    def test_upload_form_template(self):
        self.client.force_authenticate(self.lucy)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        payload = {
            "name": "test_form",
            "form_template": upload_file,
            "account": self.lucy.iaso_profile.account.pk,
        }

        response = self.client.post("/api/polio/campaignformtemplate/", data=payload, format="multipart")
        self.assertEqual(response.status_code, 201)

    def test_name_and_account_unique_together(self):
        self.client.force_authenticate(self.lucy)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        payload = {"name": "test_form", "form_template": upload_file, "account": self.lucy.iaso_profile.account.pk}

        self.client.post("/api/polio/campaignformtemplate/", data=payload, format="multipart")
        response = self.client.post("/api/polio/campaignformtemplate/", data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_template_respect_multi_tenancy(self):

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        CampaignFormTemplate.objects.create(
            name="A_FORM", account=self.lucy.iaso_profile.account, form_template=upload_file
        )

        CampaignFormTemplate.objects.create(
            name="B_FORM", account=self.lucy.iaso_profile.account, form_template=upload_file
        )

        self.client.force_authenticate(self.rebecca)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        payload = {"name": "test_form", "form_template": upload_file, "account": self.rebecca.iaso_profile.account.pk}

        self.client.post("/api/polio/campaignformtemplate/", data=payload, format="multipart")

        response = self.client.get("/api/polio/campaignformtemplate/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["account"], self.rebecca.iaso_profile.account.pk)
