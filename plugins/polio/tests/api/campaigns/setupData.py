from datetime import timedelta

from django.utils import timezone
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
        # The "has_round_on_hold" annotation is date-aware: it only flags a campaign whose
        # *next active* round (earliest round with ended_at >= today) is on hold.
        # create_campaign() only produces past rounds (2021), so we push this campaign's
        # on-hold round into the future to make it the next active round on hold.
        cls.campaign_with_on_hold_rnd1.started_at = cls.now.date() + timedelta(days=5)
        cls.campaign_with_on_hold_rnd1.ended_at = cls.now.date() + timedelta(days=15)
        cls.campaign_with_on_hold_rnd1.on_hold = True
        cls.campaign_with_on_hold_rnd1.save()

        # Rule 3: finished campaign whose last round (highest `number`) is on hold.
        cls.finished_last_round_on_hold_campaign, _, _, cls.finished_last_round_on_hold_r3, _, _ = cls.create_campaign(
            obr_name="finished last round on hold campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.finished_last_round_on_hold_r3.on_hold = True
        cls.finished_last_round_on_hold_r3.save()

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

    def _create_multiple_campaigns(self, count: int) -> list[int]:
        new_campaigns = []
        for n in range(count):
            new_campaign = Campaign(
                obr_name=f"campaign_{n}",
                account=self.account,
                detection_status="PENDING",
            )
            new_campaigns.append(new_campaign)

        result = Campaign.objects.bulk_create(new_campaigns)

        return [campaign.id for campaign in result]
