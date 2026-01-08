import datetime

from typing import List
from unittest import mock

from django.contrib.auth.models import User
from django.utils.timezone import now
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import ReasonForDelay
from plugins.polio.preparedness.exceptions import InvalidFormatError
from plugins.polio.preparedness.spreadsheet_manager import *


class PreviewPreparednessAPITestCase(APITestCase):
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

    @mock.patch("plugins.polio.api.preparedness.utils.SpreadSheetImport")
    def test_preview_invalid_document(self, mock_SpreadSheetImport, *_):
        mock_SpreadSheetImport.create_for_url.return_value = mock.MagicMock()
        url = "https://docs.google.com/spreadsheets/d/1"
        error_message = "Error test_preview_invalid_document"
        mock_SpreadSheetImport.create_for_url.side_effect = InvalidFormatError(error_message)
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        mock_SpreadSheetImport.create_for_url.assert_called_with(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get("non_field_errors"), [error_message])
