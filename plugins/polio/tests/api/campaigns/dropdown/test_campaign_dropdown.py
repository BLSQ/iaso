from django.utils import timezone
from rest_framework.status import HTTP_200_OK
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


class DropDownEndpointTestCase(APITestCase, PolioTestCaseMixin):
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

    def test_campaigns_list_dropdown_fieldset(self):
        """Test campaigns list endpoint with fieldset=dropdown parameter returns dropdown serializer format"""
        self.client.force_authenticate(self.user)
        campaign = Campaign.objects.create(obr_name="Test Campaign Dropdown", account=self.account)
        campaign_type1 = CampaignType.objects.create(name="Type1")
        campaign.campaign_types.set([campaign_type1])

        response = self.client.get(
            f"/api/polio/campaigns/?fieldset=dropdown&campaign_types={campaign_type1.id}", format="json"
        )
        response_data = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertIsInstance(response_data, list)
        self.assertEqual(len(response_data), 1)

        campaign_data = response_data[0]

        # Verify dropdown serializer structure
        self.assertIn("id", campaign_data)
        self.assertIn("obr_name", campaign_data)
        self.assertIn("campaign_types", campaign_data)
        self.assertEqual(campaign_data["id"], str(campaign.id))
        self.assertEqual(campaign_data["obr_name"], campaign.obr_name)
        self.assertIsInstance(campaign_data["campaign_types"], list)
        self.assertEqual(len(campaign_data["campaign_types"]), 1)
        campaign_type = campaign_data["campaign_types"][0]
        self.assertEqual(campaign_type["id"], campaign_type1.pk)
        self.assertEqual(campaign_type["name"], campaign_type1.name)

    def test_campaigns_list_dropdown_fieldset_only_authenticated(self):
        """Test dropdown fieldset only works for authenticated users"""
        # Without authentication, should use AnonymousCampaignSerializer
        Campaign.objects.create(obr_name="Test Campaign Dropdown", account=self.account)
        response = self.client.get("/api/polio/campaigns/?fieldset=dropdown", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertGreater(len(response_data), 0)
        first_item = response_data[0]
        keys_count = len(first_item.keys())
        self.assertGreater(keys_count, 3)  # dropdwon serializer has only 3 fields. Anonymous has way more
