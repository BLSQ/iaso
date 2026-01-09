import datetime
import os

from typing import List

import pandas as pd

from django.contrib.auth.models import User
from django.utils.timezone import now
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.export_utils import format_date
from plugins.polio.models import Campaign, ReasonForDelay, Round, RoundScope
from plugins.polio.preparedness.spreadsheet_manager import *


class CalendarXLSXExportAPITestCase(APITestCase):
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
    account: m.Account

    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = m.DataSource.objects.create(name="Default source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)
        cls.star_wars = m.Account.objects.create(name="Star Wars")
        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.account = Account.objects.create(name="Global Health Initiative", default_version=cls.source_version_1)
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
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
            username="luke", account=cls.account, permissions=[CORE_FORMS_PERMISSION], org_units=[cls.child_org_unit]
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

    def setUp(self) -> None:
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.yoda)

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

        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", account=self.account)

        c_round_1 = c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))
        c.rounds.create(number=2, started_at=datetime.date(2022, 3, 1), ended_at=datetime.date(2022, 3, 2))

        c2 = Campaign.objects.create(country_id=org_unit_2.id, obr_name="orb campaign 2", account=self.account)

        c2_round_1 = c2.rounds.create(
            number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2)
        )
        c2_round_2 = c2.rounds.create(
            number=2, started_at=datetime.date(2022, 1, 4), ended_at=datetime.date(2022, 1, 7)
        )
        file_name = "calendar_2022-10-01"
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), f"attachment; filename={file_name}.xlsx")
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name=file_name)

        excel_columns = excel_data.columns.ravel()
        self.assertEqual(excel_columns[0], "COUNTRY")
        self.assertEqual(excel_columns[3], "March")

        data_dict = excel_data.to_dict()
        self.assertEqual(data_dict["COUNTRY"][0], org_unit.name)
        self.assertEqual(data_dict["COUNTRY"][1], org_unit_2.name)
        self.assertEqual(data_dict["January"][0], self.format_date_to_test(c, c_round_1))
        self.assertEqual(data_dict["January"][1], self.format_date_to_test(c2, c2_round_1))
        self.assertEqual(data_dict["January"][2], self.format_date_to_test(c2, c2_round_2))

        self._clean_up_tmp_file(file_name)

    def test_create_calendar_xlsx_sheet_campaign_without_country(self):
        """
        When a campaign was not linked to a country, export XLSX calendar triggered an error('NoneType' object has no attribute 'id'):
            - This test checks if the error does not occur even when a campaign is not linked to country
        """
        c = Campaign.objects.create(obr_name="orb campaign", account=self.account)
        c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))

        file_name = "calendar_2022-10-01"
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name=file_name)

        data_dict = excel_data.to_dict()
        self.assertEqual(len(data_dict["COUNTRY"]), 0)

        self._clean_up_tmp_file(file_name)

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

        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", account=self.account)
        round = c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=None)

        file_name = "calendar_2022-10-01"
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name=file_name)

        data_dict = excel_data.to_dict()
        self.assertEqual(data_dict["January"][0], self.format_date_to_test(c, round))

        self._clean_up_tmp_file(file_name)

    def test_create_calendar_xlsx_sheet_without_test_campaigns(self):
        """
        Test campaigns appeared in the XLSX, but they should not
            - This test is to make sure that no test campaign appear again in the XLSX calendar export
        """
        org_unit = OrgUnit.objects.create(
            id=5455,
            name="Country name",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )
        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", is_test=True, account=self.account)
        c.rounds.create(number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2))

        file_name = "calendar_2022-10-01"
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name=file_name)

        data_dict = excel_data.to_dict()
        self.assertEqual(len(data_dict["COUNTRY"]), 0)

        self._clean_up_tmp_file(file_name)

    def test_create_calendar_xlsx_sheet_with_separate_scopes_per_round(self):
        """
        When a campaign is separeted into scopes per round:
            - This test checks if the xlsx file displays into separeted scopes per round
        """
        org_unit = OrgUnit.objects.create(
            id=5455,
            name="Country name",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        c = Campaign.objects.create(country_id=org_unit.id, obr_name="orb campaign", account=self.account)

        c_round_1 = Round.objects.create(
            number=1, started_at=datetime.date(2022, 1, 1), ended_at=datetime.date(2022, 1, 2)
        )
        c_round_2 = Round.objects.create(
            number=2, started_at=datetime.date(2022, 1, 3), ended_at=datetime.date(2022, 1, 4)
        )
        c.rounds.add(c_round_1)
        c.rounds.add(c_round_2)
        c.save()

        district_1 = OrgUnit.objects.create(
            id=5460,
            name="district 1",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        district_2 = OrgUnit.objects.create(
            id=5461,
            name="district 2",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        org_units_group_1 = m.Group.objects.create(name="group_1")
        org_units_group_1.org_units.add(district_1)
        org_units_group_1.save()

        org_units_group_2 = m.Group.objects.create(name="group_2")
        org_units_group_2.org_units.add(district_2)
        org_units_group_2.save()

        RoundScope.objects.create(vaccine="nOPV2", group=org_units_group_1, round=c_round_1)
        RoundScope.objects.create(vaccine="mOPV2", group=org_units_group_2, round=c_round_2)
        c.separate_scopes_per_round = True
        c.save()
        c.refresh_from_db()
        file_name = "calendar_2022-10-01"
        response = self.client.get("/api/polio/campaigns/create_calendar_xlsx_sheet/", {"currentDate": "2022-10-01"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=calendar_2022-10-01.xlsx")
        excel_data = pd.read_excel(response.content, engine="openpyxl", sheet_name=file_name)

        excel_columns = excel_data.columns.ravel()
        self.assertEqual(excel_columns[0], "COUNTRY")
        self.assertEqual(excel_columns[3], "March")

        data_dict = excel_data.to_dict()
        self.assertEqual(data_dict["COUNTRY"][0], org_unit.name)
        self.assertEqual(data_dict["January"][0], self.format_date_to_test(c, c_round_1))
        self.assertEqual(data_dict["January"][1], self.format_date_to_test(c, c_round_2))
        self._clean_up_tmp_file(file_name)

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
            + round.vaccine_names
            + "\n"
        )

    def _clean_up_tmp_file(self, file_name):
        # Some tests here create a tmp file through /api/polio/campaigns/create_calendar_xlsx_sheet/
        if os.path.exists(file_name):
            os.remove(file_name)
