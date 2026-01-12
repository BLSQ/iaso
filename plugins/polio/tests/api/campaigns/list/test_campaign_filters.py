from django.utils import timezone
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED
from rest_framework.test import APIClient

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, IasoTestCaseMixin
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.models.base import CampaignType
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


URL = "/api/polio/campaigns/"


class CampaignListAPITestCase(APITestCase, IasoTestCaseMixin, PolioTestCaseMixin):
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

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country")
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

    def test_no_filter_params(self):
        """Campaign category can be one of 'preventive', 'on_hold', 'is_planned', or 'regular'.
        There is also an 'implicit' category of test campaigns. They will be excluded when selecting 'regular' but otherwise returned.
        There is a separate `is_test` query param, to explicitly include/exclude test campaigns, but campaign_category takes precedence.
        If no option is selected, no filtering is performed. This is the option 'All' in the UI.
        There is a separate 'on_hold' filter (query param: on_hold) which historically takes precedence, e.g on 'regular' filter
        """

        expected_obr_names = [
            self.regular_campaign.obr_name,
            self.preventive_campaign.obr_name,
            self.planned_campaign.obr_name,
            self.planned_preventive_campaign.obr_name,
            self.campaign_with_on_hold_round.obr_name,
        ]  # using to obr_names to avoid having to cast UUID to string

        self.client.force_authenticate(self.user)

        # not passing the query params returns campaigns from all categories except test and on hold
        response = self.client.get(f"{URL}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(expected_obr_names, obr_names)

    def test_filter_by_campaign_types(self):
        self.client.force_authenticate(self.user)
        campaign_type1 = CampaignType.objects.create(name="Type1")
        campaign_type2 = CampaignType.objects.create(name="Type2")
        campaign_type3 = CampaignType.objects.create(name="Type3")
        campaign1 = Campaign.objects.create(obr_name="Campaign1", account=self.account)
        campaign2 = Campaign.objects.create(obr_name="Campaign2", account=self.account)
        campaign3 = Campaign.objects.create(obr_name="Campaign3", account=self.account)
        campaign1.campaign_types.add(campaign_type1)
        campaign2.campaign_types.add(campaign_type2)
        campaign3.campaign_types.add(campaign_type3)

        # Filter by single campaign type
        response = self.client.get(f"{URL}?campaign_types={campaign_type1.id}", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]["id"], str(campaign1.id))

        # Filter by single campaign type using slug
        response = self.client.get(f"{URL}?campaign_types={campaign_type1.slug}", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]["id"], str(campaign1.id))

        # Filter by multiple campaign types
        response = self.client.get(
            f"{URL}?campaign_types={campaign_type1.id},{campaign_type2.id}",
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        campaign_ids = [campaign["id"] for campaign in response_data]
        self.assertIn(str(campaign1.id), campaign_ids)
        self.assertIn(str(campaign2.id), campaign_ids)

        # Filter by multiple campaign types
        response = self.client.get(
            f"{URL}?campaign_types={campaign_type1.slug},{campaign_type2.slug}",
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        campaign_ids = [campaign["id"] for campaign in response_data]
        self.assertIn(str(campaign1.id), campaign_ids)
        self.assertIn(str(campaign2.id), campaign_ids)

        # Filter by non-existing campaign type
        response = self.client.get(f"{URL}?campaign_types=9999", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        response_data = response.json()
        self.assertEqual(len(response_data), 0)

        # Filter by non-existing campaign type
        response = self.client.get(f"{URL}?campaign_types=UNKNOWN_CAMPAIGN_TYPE", format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(response_data), 0)

    def test_filter_test_campaigns(self):
        self.client.force_authenticate(self.user)
        # Count existing campaigns from setUpTestData
        # the show_test/is_test filter filters out test campaigns when false
        # but returns ALL campaigns when true, i.E it doesn't exclude on test campaigns
        # We filter out on hold in the test setup because these are excluded by default
        initial_count = Campaign.objects.filter(on_hold=False).count()
        # Count existing visible non-test campaigns from setUpTestData (default filters: show_test=false, on_hold=false)
        initial_visible_count = Campaign.objects.filter(is_test=False, on_hold=False).count()

        payload1 = {
            "account": self.account.pk,
            "obr_name": "test obr_name",
            "detection_status": "PENDING",
            "is_test": True,
        }
        self.client.post("/api/polio/campaigns/", payload1, format="json")

        payload2 = {
            "account": self.account.pk,
            "obr_name": "non test obr_name_1",
            "detection_status": "PENDING",
            "is_test": False,
        }
        self.client.post("/api/polio/campaigns/", payload2, format="json")

        # return only test campaigns
        response = self.client.get("/api/polio/campaigns/?show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(result), initial_count + 2)  # +2 new campaigns created
        obr_names = [r["obr_name"] for r in result]
        self.assertIn(payload1["obr_name"], obr_names)

        # return non test campaigns by default
        response = self.client.get("/api/polio/campaigns/")
        result = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(result), initial_visible_count + 1)
        obr_names = [r["obr_name"] for r in result]
        self.assertNotIn(payload1["obr_name"], obr_names)
        self.assertFalse(result[0]["is_test"])

        # return non test campaigns  (explicit exclusion)
        response = self.client.get("/api/polio/campaigns/?show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [r["obr_name"] for r in result]
        self.assertEqual(len(result), initial_visible_count + 1)
        self.assertNotIn(payload1["obr_name"], obr_names)
        self.assertFalse(result[0]["is_test"])

    def test_filter_by_deletion_status(self):
        self.client.force_authenticate(self.user)
        # Count existing campaigns from setUpTestData, excluding test and on_hold, to account for API default filtering
        initial_total_count = Campaign.objects.filter(is_test=False, on_hold=False).count()

        new_ids = self._create_multiple_campaigns(10)

        total_campaigns = initial_total_count + 10

        # Delete first 8 campaigns
        deleted_count = 0
        for c_id in new_ids[:8]:
            self.client.delete(f"{URL}{c_id}/")
            deleted_count += 1

        response = self.client.get(f"{URL}?deletion_status=deleted", format="json")

        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), deleted_count)

        # test that it return all (including deleted, but excluding test and on_hold - beacuse of API default params)
        response = self.client.get(f"{URL}?deletion_status=all", format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), total_campaigns)

        # per defaut it return undeleted, i.e "active" (with default filters: show_test=false, on_hold=false)
        # Calculate remaining visible campaigns after deletion
        remaining_visible = Campaign.objects.filter(deleted_at__isnull=True, is_test=False, on_hold=False).count()

        response = self.client.get(f"{URL}", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), remaining_visible)

        # filter on active
        response = self.client.get(f"{URL}?deletion_status=active", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), remaining_visible)

    def test_filter_category_regular(self):
        # regular campaign: default on hold param overrides category filter (legacy behaviour)
        response = self.client.get(f"{URL}?campaign_category=regular")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,
            ],
        )
        # regular campaign, with on_hold==True
        response = self.client.get(f"{URL}?campaign_category=regular&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 3)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,
            ],
        )

        # regular campaign overrides is_test
        response = self.client.get(f"{URL}?campaign_category=regular&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,
            ],
        )
        # regular with show test explicitly false (for the sake of coverage)
        response = self.client.get(f"{URL}?campaign_category=regular&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,
            ],
        )

        # on_hold query param taken into account when selecting regular campaigns
        response = self.client.get(f"{URL}?campaign_category=regular&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 3)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # on_hold rounds not currently excluded by filter
            ],
        )
        response = self.client.get(f"{URL}?campaign_category=regular&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # on_hold rounds not currently excluded by filter
            ],
        )

    def test_filter_category_preventive(self):
        # preventive
        response = self.client.get(f"{URL}?campaign_category=preventive")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
            ],
        )

        # preventive on hold
        response = self.client.get(f"{URL}?campaign_category=preventive&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
                self.preventive_on_hold_campaign.obr_name,
            ],
        )
        # preventive on hold == false (explicit)
        response = self.client.get(f"{URL}?campaign_category=preventive&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
            ],
        )
        # preventive test
        response = self.client.get(f"{URL}?campaign_category=preventive&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
                self.preventive_test_campaign.obr_name,
            ],
        )
        # preventive test==false (explicit)
        response = self.client.get(f"{URL}?campaign_category=preventive&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
            ],
        )
        # preventive test on hold
        response = self.client.get(f"{URL}?campaign_category=preventive&show_test=true&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 4)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
                self.preventive_test_campaign.obr_name,
                self.preventive_on_hold_campaign.obr_name,
                self.preventive_test_on_hold_campaign.obr_name,
            ],
        )

    def test_filter_category_on_hold(self):
        # on_hold
        response = self.client.get(f"{URL}?campaign_category=on_hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)  # on_hold query param takes precedence and defaults to false

        # on_hold query param takes precedence
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)

        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,  # the filter doesn't check if rounds are on_hold
                self.preventive_on_hold_campaign.obr_name,
            ],
        )

        # on hold + show_test
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 4)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,  # the filter doesn't check if rounds are on_hold
                self.test_on_hold_campaign.obr_name,
                self.preventive_on_hold_campaign.obr_name,
                self.preventive_test_on_hold_campaign.obr_name,
            ],
        )
        # on hold + show_test=false (explicit)
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 2)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,  # the filter doesn't check if rounds are on_hold
                self.preventive_on_hold_campaign.obr_name,
            ],
        )

    def test_filter_category_planned(self):
        # planned
        response = self.client.get(f"{URL}?campaign_category=is_planned")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.planned_campaign.obr_name, self.planned_preventive_campaign.obr_name],
        )
        # planned with show test explicitly false
        response = self.client.get(f"{URL}?campaign_category=is_planned&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.planned_campaign.obr_name, self.planned_preventive_campaign.obr_name],
        )

        # planned test
        response = self.client.get(f"{URL}?campaign_category=is_planned&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 4)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.planned_campaign.obr_name,
                self.planned_preventive_campaign.obr_name,
                self.planned_test_campaign.obr_name,
                self.planned_preventive_test_campaign.obr_name,
            ],
        )

    def test_filter_on_hold_campaigns(self):
        # not passing the param is same as passing False
        default_obr_names = [
            self.regular_campaign.obr_name,
            self.preventive_campaign.obr_name,
            self.planned_campaign.obr_name,
            self.planned_preventive_campaign.obr_name,
            self.campaign_with_on_hold_round.obr_name,
        ]  # using to obr_names to avoid having to cast UUID to string

        # explicitly pass false
        response = self.client.get(f"{URL}?on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(default_obr_names, obr_names)

        # pass true
        response = self.client.get(f"{URL}?on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        expected_on_hold_obr_names = [
            *default_obr_names,
            self.preventive_on_hold_campaign.obr_name,
            self.on_hold_campaign.obr_name,
        ]
        self.assertCountEqual(expected_on_hold_obr_names, obr_names)

        # test param precedence over campaign category
        # This is a dupe of the same test in test_filter_category_on_hold, but I'd rather ensure we don't inadvertently remove coverage
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)

        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,  # the filter doesn't check if rounds are on_hold
                self.preventive_on_hold_campaign.obr_name,
            ],
        )

    def test_search_filter(self):
        campaign_with_epid, _, _, _, country_epid, _ = self.create_campaign(
            obr_name="with EPID",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        campaign_with_epid.epid = "plann"
        campaign_with_epid.save()

        geo_limited_user = self.create_user_with_profile(
            username="geo-limited guy",
            account=self.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[self.regular_country, self.preventive_country, country_epid],
        )

        # expect result of search to return matching obr names and epids
        expected_obr_names = [
            self.planned_campaign.obr_name,
            self.planned_preventive_campaign.obr_name,
            campaign_with_epid.obr_name,
        ]  # using to obr_names to avoid having to cast UUID to string

        self.client.force_authenticate(self.user)

        # not passing the query params returns campaigns from all categories except test and on hold
        response = self.client.get(f"{URL}?search=plann")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(expected_obr_names, obr_names)
        # filter is case insensitive
        response = self.client.get(f"{URL}?search=pLanN")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(expected_obr_names, obr_names)

        # default filters apply (on hold, test)
        response = self.client.get(f"{URL}?search=test")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)
        response = self.client.get(f"{URL}?search=hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["obr_name"], self.campaign_with_on_hold_round.obr_name)

        self.client.force_authenticate(geo_limited_user)
        # test search geo limited
        response = self.client.get(
            f"{URL}?search=plann"
        )  # would return planned campaigns, geo-limited user can't see them, only the campaign with the matching EPID
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["epid"], campaign_with_epid.epid)

        response = self.client.get(f"{URL}?search=campaign")
        result = self.assertJSONResponse(response, HTTP_200_OK)  # returns only the campaigns the user has access to
        obr_names = [r["obr_name"] for r in result]
        self.assertCountEqual(obr_names, [self.regular_campaign.obr_name, self.preventive_campaign.obr_name])

    def test_filter_by_country_group(self):
        pass

    def test_filter_by_grouped_campaigns(self):
        pass
