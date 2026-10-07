from datetime import date, datetime, timedelta, timezone

import time_machine

from rest_framework.status import HTTP_200_OK

from iaso.models.base import Group
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.models.base import CampaignGroup, CampaignType
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.campaigns.setupData import CampaignFiltersTestBase


URL = "/api/polio/campaigns/"
FIXED_NOW = datetime(2026, 6, 22, 12, 0, 0, tzinfo=timezone.utc)


class CampaignFiltersAPITestCase(CampaignFiltersTestBase):
    def test_no_filter_params(self):
        expected_obr_names = list(Campaign.objects.all().values_list("obr_name", flat=True))

        self.client.force_authenticate(self.user)

        response = self.client.get(f"{URL}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(expected_obr_names, obr_names)

    def test_show_test_default_behaviour(self):
        """When `show_test` is omitted, no test filtering is applied: test campaigns are included,
        identical to `show_test=true`. `show_test=false` is the only value that excludes them.
        """
        self.client.force_authenticate(self.user)

        all_obr_names = list(Campaign.objects.values_list("obr_name", flat=True))
        test_obr_names = list(Campaign.objects.filter(is_test=True).values_list("obr_name", flat=True))
        non_test_obr_names = list(Campaign.objects.filter(is_test=False).values_list("obr_name", flat=True))

        # the fixture must contain both test and non-test campaigns for this test to be meaningful
        self.assertTrue(len(test_obr_names) > 0)
        self.assertTrue(len(non_test_obr_names) > 0)

        # param omitted: test campaigns are included
        response = self.client.get(f"{URL}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        default_obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(default_obr_names, all_obr_names)

        # show_test=true behaves exactly like the omitted default
        response = self.client.get(f"{URL}?show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        show_test_true_obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(show_test_true_obr_names, default_obr_names)

        # show_test=false is the only value that excludes test campaigns
        response = self.client.get(f"{URL}?show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        show_test_false_obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(show_test_false_obr_names, non_test_obr_names)
        for name in test_obr_names:
            self.assertNotIn(name, show_test_false_obr_names)

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

        # A test campaign sharing a type is included by default but excluded with show_test==false
        test_campaign_typed = Campaign.objects.create(
            obr_name="Test typed campaign", account=self.account, is_test=True
        )
        test_campaign_typed.campaign_types.add(campaign_type1)

        response = self.client.get(f"{URL}?campaign_types={campaign_type1.id}", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        campaign_ids = [c["id"] for c in response_data]
        self.assertCountEqual(campaign_ids, [str(campaign1.id), str(test_campaign_typed.id)])

        response = self.client.get(f"{URL}?campaign_types={campaign_type1.id}&show_test=false", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        campaign_ids = [c["id"] for c in response_data]
        self.assertEqual(campaign_ids, [str(campaign1.id)])

    def test_filter_test_campaigns(self):
        self.client.force_authenticate(self.user)

        initial_count = Campaign.objects.count()

        # Count existing visible non-test campaigns from setUpTestData
        initial_visible_count = Campaign.objects.filter(is_test=False).count()

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

        # return non test campaigns  (explicit exclusion)
        response = self.client.get("/api/polio/campaigns/?show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [r["obr_name"] for r in result]
        self.assertEqual(len(result), initial_visible_count + 1)
        self.assertNotIn(payload1["obr_name"], obr_names)
        self.assertFalse(result[0]["is_test"])

    def test_filter_by_deletion_status(self):
        self.client.force_authenticate(self.user)

        initial_total_count = Campaign.objects.count()

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

        # test that it return all (including deleted, but excluding test and on_hold - because of API default params)
        response = self.client.get(f"{URL}?deletion_status=all", format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), total_campaigns)

        # Calculate remaining visible campaigns after deletion
        remaining_visible = Campaign.objects.filter(deleted_at__isnull=True).count()

        response = self.client.get(f"{URL}", format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), remaining_visible)

        # filter on active
        response = self.client.get(f"{URL}?deletion_status=active", format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), remaining_visible)

    def test_filter_category_regular(self):
        # regular category: excludes campaigns on hold and campaigns with current or next round on hold.
        # Finished campaigns whose last round was on hold are not excluded (known overlap with on_hold).
        response = self.client.get(f"{URL}?campaign_category=regular")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 3)

        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.test_campaign.obr_name,
                self.finished_last_round_on_hold_campaign.obr_name,
            ],
        )

        # regular with show_test==false excludes the test campaign
        response = self.client.get(f"{URL}?campaign_category=regular&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 2)
        self.assertCountEqual(
            obr_names,
            [
                self.regular_campaign.obr_name,
                self.finished_last_round_on_hold_campaign.obr_name,
            ],
        )

    def test_filter_category_preventive(self):
        # preventive campaigns cannot be on_hold
        response = self.client.get(f"{URL}?campaign_category=is_preventive")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 2)
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
                self.preventive_test_campaign.obr_name,
            ],
        )

        # preventive with show_test==false
        response = self.client.get(f"{URL}?campaign_category=is_preventive&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 1)
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
            ],
        )

    def test_filter_category_on_hold(self):
        # on_hold category: campaign on hold, active/next round on hold, or finished with last round on hold

        response = self.client.get(f"{URL}?campaign_category=on_hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 6)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
                self.finished_last_round_on_hold_campaign.obr_name,  # finished, last round on hold
                self.test_on_hold_campaign.obr_name,
                self.preventive_on_hold_campaign.obr_name,
                self.preventive_test_on_hold_campaign.obr_name,
            ],
        )

        # on hold + show_test
        response = self.client.get(f"{URL}?campaign_category=on_hold&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 4)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
                self.finished_last_round_on_hold_campaign.obr_name,
                self.preventive_on_hold_campaign.obr_name,
            ],
        )

    def test_filter_category_planned(self):
        # planned
        response = self.client.get(f"{URL}?campaign_category=is_planned")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 4)
        self.assertCountEqual(
            obr_names,
            [
                self.planned_campaign.obr_name,
                self.planned_preventive_campaign.obr_name,
                self.planned_test_campaign.obr_name,
                self.planned_preventive_test_campaign.obr_name,
            ],
        )
        # planned with show test false
        response = self.client.get(f"{URL}?campaign_category=is_planned&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 2)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.planned_campaign.obr_name, self.planned_preventive_campaign.obr_name],
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
            self.planned_preventive_test_campaign.obr_name,
            self.planned_test_campaign.obr_name,
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

        # search combined with show_test==false excludes test campaigns from the results
        response = self.client.get(f"{URL}?search=plann&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.planned_campaign.obr_name,
                self.planned_preventive_campaign.obr_name,
                campaign_with_epid.obr_name,
            ],
        )

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
        # add regular campaigns
        regular_campaign2, _, _, _, regular_country2, _ = self.create_campaign(
            obr_name="regular campaign 2",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
            country_name="country2",
        )
        regular_campaign3, _, _, _, regular_country3, _ = self.create_campaign(
            obr_name="regular campaign 3",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
            country_name="country3",
        )
        # create country groups with only some of the campaign countries
        country_group = Group.objects.create(
            name="Country block", block_of_countries=True, source_version=self.source_version_1
        )
        country_group.org_units.set([self.regular_country, regular_country2])
        country_group2 = Group.objects.create(
            name="Country block2", block_of_countries=True, source_version=self.source_version_1
        )
        country_group2.org_units.set([regular_country3])

        # test filtering
        self.client.force_authenticate(self.user)

        # not passing the query params returns campaigns from all categories except test and on hold
        response = self.client.get(f"{URL}?org_unit_groups={country_group.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name])

        # test passing comma-separated group ids
        response = self.client.get(f"{URL}?org_unit_groups={country_group.id},{country_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name, regular_campaign3.obr_name]
        )
        # test filtering with geo-limited user
        geo_limited_user = self.create_user_with_profile(
            username="geo-limited guy",
            account=self.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[regular_country2, regular_country3],
        )
        self.client.force_authenticate(geo_limited_user)
        response = self.client.get(f"{URL}?org_unit_groups={country_group.id},{country_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [regular_campaign2.obr_name, regular_campaign3.obr_name])

    def test_filter_by_grouped_campaigns(self):
        # add regular campaigns
        regular_campaign2, _, _, _, regular_country2, _ = self.create_campaign(
            obr_name="regular campaign 2",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
            country_name="country2",
        )
        regular_campaign3, _, _, _, regular_country3, _ = self.create_campaign(
            obr_name="regular campaign 3",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
            country_name="country3",
        )
        # create country groups with only some of the campaign countries
        campaign_group = CampaignGroup.objects.create(
            name="Campaign group",
        )
        campaign_group.campaigns.set([self.regular_campaign, regular_campaign2])

        campaign_group2 = CampaignGroup.objects.create(
            name="Campaign group2",
        )
        campaign_group2.campaigns.set([regular_campaign3])

        # test filtering
        self.client.force_authenticate(self.user)

        # not passing the query params returns campaigns from all categories except test and on hold
        response = self.client.get(f"{URL}?campaign_groups={campaign_group.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name])

        # test passing comma-separated group ids
        response = self.client.get(f"{URL}?campaign_groups={campaign_group.id},{campaign_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name, regular_campaign3.obr_name]
        )
        # test filtering with geo-limited user
        geo_limited_user = self.create_user_with_profile(
            username="geo-limited guy",
            account=self.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[regular_country2, regular_country3],
        )
        self.client.force_authenticate(geo_limited_user)
        response = self.client.get(f"{URL}?campaign_groups={campaign_group.id},{campaign_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [regular_campaign2.obr_name, regular_campaign3.obr_name])

    def test_filter_composition_category_and_search(self):
        """Filters compose (AND): campaign_category intersects with search, and show_test narrows further."""
        self.client.force_authenticate(self.user)

        # campaign_category=is_planned alone returns the 4 planned campaigns; intersecting with
        # search=preventive keeps only the planned campaigns whose obr_name contains "preventive"
        response = self.client.get(f"{URL}?campaign_category=is_planned&search=preventive")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.planned_preventive_campaign.obr_name,
                self.planned_preventive_test_campaign.obr_name,
            ],
        )

        # adding show_test=false drops the test campaign from the intersection
        response = self.client.get(f"{URL}?campaign_category=is_planned&search=preventive&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [self.planned_preventive_campaign.obr_name])

    def test_filter_composition_category_and_deletion_status(self):
        """campaign_category composes with the deletion status backend."""
        self.client.force_authenticate(self.user)

        on_hold_default = [
            self.campaign_with_on_hold_round.obr_name,
            self.finished_last_round_on_hold_campaign.obr_name,
            self.test_on_hold_campaign.obr_name,
            self.preventive_on_hold_campaign.obr_name,
            self.preventive_test_on_hold_campaign.obr_name,
            self.on_hold_campaign.obr_name,
        ]

        # soft-delete one of the on_hold campaigns
        self.client.delete(f"{URL}{self.on_hold_campaign.id}/")

        # default (active only) excludes the deleted campaign while keeping the category filter
        response = self.client.get(f"{URL}?campaign_category=on_hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [name for name in on_hold_default if name != self.on_hold_campaign.obr_name],
        )

        # deletion_status=deleted intersected with the category returns only the deleted on_hold campaign
        response = self.client.get(f"{URL}?campaign_category=on_hold&deletion_status=deleted")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, [self.on_hold_campaign.obr_name])

        # deletion_status=all brings the deleted campaign back into the category results
        response = self.client.get(f"{URL}?campaign_category=on_hold&deletion_status=all")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(obr_names, on_hold_default)

        self.client.patch(f"{URL}restore_deleted_campaigns/", {"id": str(self.on_hold_campaign.id)})
        self.assertJSONResponse(response, HTTP_200_OK)


class CampaignOnHoldCategoryEdgeCasesTestCase(CampaignFiltersTestBase):
    """Edge cases for on_hold category filtering rules 2 and 3."""

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def _on_hold_obr_names(self):
        response = self.client.get(f"{URL}?campaign_category=on_hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        return [campaign["obr_name"] for campaign in result]

    def test_on_hold_excludes_finished_non_last_round_on_hold(self):
        campaign, rnd1, _, _, _, _ = self.create_campaign(
            obr_name="finished non-last round on hold",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd1.on_hold = True
        rnd1.save()

        self.assertNotIn(campaign.obr_name, self._on_hold_obr_names())

    @time_machine.travel(FIXED_NOW, tick=False)
    def test_on_hold_active_round_ending_today_is_included(self):
        today = FIXED_NOW.date()
        campaign, rnd1, rnd2, rnd3, _, _ = self.create_campaign(
            obr_name="active round ending today on hold",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd1.started_at = today - timedelta(days=10)
        rnd1.ended_at = today
        rnd1.on_hold = True
        rnd1.save()
        rnd2.started_at = today + timedelta(days=30)
        rnd2.ended_at = today + timedelta(days=40)
        rnd2.on_hold = False
        rnd2.save()
        rnd3.started_at = today + timedelta(days=50)
        rnd3.ended_at = today + timedelta(days=60)
        rnd3.on_hold = False
        rnd3.save()

        self.assertIn(campaign.obr_name, self._on_hold_obr_names())

    @time_machine.travel(FIXED_NOW, tick=False)
    def test_on_hold_finished_last_round_ended_yesterday_is_included(self):
        today = FIXED_NOW.date()
        campaign, _, _, rnd3, _, _ = self.create_campaign(
            obr_name="finished last round ended yesterday on hold",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd3.on_hold = True
        rnd3.ended_at = today - timedelta(days=1)
        rnd3.save()

        self.assertIn(campaign.obr_name, self._on_hold_obr_names())

    def test_on_hold_excludes_last_round_on_hold_with_null_ended_at(self):
        campaign, _, _, rnd3, _, _ = self.create_campaign(
            obr_name="last round on hold null ended_at",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd3.on_hold = True
        rnd3.ended_at = None
        rnd3.save()

        self.assertNotIn(campaign.obr_name, self._on_hold_obr_names())

    def test_on_hold_last_round_by_number_not_by_date(self):
        campaign, _, rnd2, rnd3, _, _ = self.create_campaign(
            obr_name="last round by number on hold",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd3.on_hold = True
        rnd3.ended_at = date(2021, 3, 10)
        rnd3.save()
        rnd2.on_hold = False
        rnd2.ended_at = date(2022, 6, 1)
        rnd2.save()

        self.assertIn(campaign.obr_name, self._on_hold_obr_names())

        campaign2, _, rnd2b, rnd3b, _, _ = self.create_campaign(
            obr_name="non-last round by number on hold only",
            account=self.account,
            source_version=self.source_version_1,
            country_ou_type=self.country_type,
            district_ou_type=self.district_type,
        )
        rnd2b.on_hold = True
        rnd2b.ended_at = date(2022, 6, 1)
        rnd2b.save()
        rnd3b.on_hold = False
        rnd3b.ended_at = date(2021, 3, 10)
        rnd3b.save()

        self.assertNotIn(campaign2.obr_name, self._on_hold_obr_names())
