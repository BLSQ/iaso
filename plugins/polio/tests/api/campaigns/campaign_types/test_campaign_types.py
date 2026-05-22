from django.utils import timezone
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import (
    Campaign,
    CampaignType,
)
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


class CampaignTypesAPITestCase(APITestCase, PolioTestCaseMixin):
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

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def test_campaign_api_returns_campaign_types(self):
        self.client.force_authenticate(self.user)
        campaign_type1 = CampaignType.objects.create(name="Type1")
        campaign_type2 = CampaignType.objects.create(name="Type2")
        campaign_type_ids = [campaign_type1.id, campaign_type2.id]

        campaign = Campaign.objects.create(obr_name="Campaign with Types", account=self.account)
        campaign.campaign_types.set([campaign_type1, campaign_type2])

        response = self.client.get(f"/api/polio/campaigns/{campaign.id}/", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()

        self.assertIn("campaign_types", response_data)
        campaign_types = response_data["campaign_types"]
        self.assertEqual(len(campaign_types), 2)

        self.assertIn(campaign_type1.id, campaign_type_ids)
        self.assertIn(campaign_type2.id, campaign_type_ids)

    def test_available_campaign_types(self):
        self.client.force_authenticate(self.user)
        campaign_types_count = CampaignType.objects.count()

        response = self.client.get("/api/polio/campaigns/available_campaign_types/", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()

        self.assertEqual(len(response_data), campaign_types_count)
        self.assertIn(CampaignType.POLIO, [ct["name"] for ct in response_data])
