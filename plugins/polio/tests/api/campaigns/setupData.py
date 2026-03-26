from django.utils import timezone
from rest_framework.status import HTTP_201_CREATED
from rest_framework.test import APIClient

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, IasoTestCaseMixin
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


class CampaignFiltersTestBase(APITestCase, IasoTestCaseMixin, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.now = timezone.now()
        cls.account, cls.data_source, cls.source_version_1, _ = cls.create_account_datasource_version_project(
            source_name="Default source", account_name="polio", project_name="polio", app_id="com.polio.app"
        )

        cls.other_account = m.Account.objects.create(name="Other account")
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
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
        cls.user_no_permission = cls.create_user_with_profile(
            username="user_no_permission",
            account=cls.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[cls.child_org_unit],
        )

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country", category="COUNTRY")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district")

        cls.regular_campaign, _, _, _, cls.regular_country, _ = cls.create_campaign(
            obr_name="regular campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.preventive_campaign, _, _, _, cls.preventive_country, _ = cls.create_campaign(
            obr_name="preventive campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.preventive_campaign.is_preventive = True
        cls.preventive_campaign.save()

        cls.planned_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="planned campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.planned_campaign.is_planned = True
        cls.planned_campaign.save()

        cls.test_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="test campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.test_campaign.is_test = True
        cls.test_campaign.save()

        cls.on_hold_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="on hold campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.on_hold_campaign.on_hold = True
        cls.on_hold_campaign.save()

        cls.campaign_with_on_hold_round, cls.campaign_with_on_hold_rnd1, _, _, _, _ = cls.create_campaign(
            obr_name="campaign with rnd on hold",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.campaign_with_on_hold_rnd1.on_hold = True
        cls.campaign_with_on_hold_rnd1.save()

        # planned preventive
        cls.planned_preventive_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="planned preventive campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.planned_preventive_campaign.is_planned = True
        cls.planned_preventive_campaign.is_preventive = True
        cls.planned_preventive_campaign.save()

        # planned test
        cls.planned_test_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="planned test campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.planned_test_campaign.is_planned = True
        cls.planned_test_campaign.is_test = True
        cls.planned_test_campaign.save()

        # preventive on hold
        cls.preventive_on_hold_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="preventive on hold campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.preventive_on_hold_campaign.is_preventive = True
        cls.preventive_on_hold_campaign.on_hold = True
        cls.preventive_on_hold_campaign.save()

        # preventive test
        cls.preventive_test_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="preventive test campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.preventive_test_campaign.is_preventive = True
        cls.preventive_test_campaign.is_test = True
        cls.preventive_test_campaign.save()

        # preventive test on hold
        cls.preventive_test_on_hold_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="preventive test on hold campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.preventive_test_on_hold_campaign.is_preventive = True
        cls.preventive_test_on_hold_campaign.is_test = True
        cls.preventive_test_on_hold_campaign.on_hold = True
        cls.preventive_test_on_hold_campaign.save()

        # planned preventive test
        cls.planned_preventive_test_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="planned preventive test campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.planned_preventive_test_campaign.is_preventive = True
        cls.planned_preventive_test_campaign.is_test = True
        cls.planned_preventive_test_campaign.is_planned = True
        cls.planned_preventive_test_campaign.save()

        # test on hold
        cls.test_on_hold_campaign, _, _, _, _, _ = cls.create_campaign(
            obr_name="test on hold campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.test_on_hold_campaign.is_test = True
        cls.test_on_hold_campaign.on_hold = True
        cls.test_on_hold_campaign.save()

        # planned on hold is not possible so we don't test it

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def _create_multiple_campaigns(self, count: int) -> None:
        self.client.force_authenticate(self.user)
        created_ids = []
        for n in range(count):
            payload = {
                "account": self.account.pk,
                "obr_name": f"campaign_{n}",
                "detection_status": "PENDING",
            }
            response = self.client.post("/api/polio/campaigns/", payload, format="json")
            result = self.assertJSONResponse(response, HTTP_201_CREATED)
            created_ids.append(result["id"])
        return created_ids
