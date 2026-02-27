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


class CampaignFiltersAPITestCase(CampaignFiltersTestBase):
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
        # regular category: excludes campaigns on hold and campaigns with at least 1 round on hold
        response = self.client.get(f"{URL}?campaign_category=regular")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)

        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.regular_campaign.obr_name],
        )

        # regular campaign overrides is_test
        response = self.client.get(f"{URL}?campaign_category=regular&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.regular_campaign.obr_name],
        )
        # regular with show test explicitly false (for the sake of coverage)
        response = self.client.get(f"{URL}?campaign_category=regular&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.regular_campaign.obr_name],
        )

        # on_hold query param taken into account when selecting regular campaigns:
        # regular campaign, with on_hold==True (includes on_hold campaigns and those with rounds on hold)
        response = self.client.get(f"{URL}?campaign_category=regular&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 3)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.regular_campaign.obr_name, self.campaign_with_on_hold_round.obr_name, self.on_hold_campaign.obr_name],
        )
        # regular campaign, with on_hold==True (excludes on_hold campaigns and those with rounds on hold)
        response = self.client.get(f"{URL}?campaign_category=regular&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [self.regular_campaign.obr_name],
        )

    def test_filter_category_preventive(self):
        # preventive category: excludes campaigns on hold and campaigns with at least 1 round on hold
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

        # preventive with on_hold=true (still excludes on_hold campaigns and those with rounds on hold)
        response = self.client.get(f"{URL}?campaign_category=preventive&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 1)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.preventive_campaign.obr_name,  # planned campaigns are excluded
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
        # preventive test with on_hold=true (excludes preventive_on_hold and preventive_test_on_hold)
        response = self.client.get(f"{URL}?campaign_category=preventive&show_test=true&on_hold=true")
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

    def test_filter_category_on_hold(self):
        # on_hold category: returns campaigns on hold OR with at least 1 round on hold
        response = self.client.get(f"{URL}?campaign_category=on_hold")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)  # on_hold query param takes precedence and defaults to false

        # on_hold query param takes precedence
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 0)

        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result), 3)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
                self.preventive_on_hold_campaign.obr_name,
            ],
        )

        # on hold + show_test
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true&show_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 5)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
                self.test_on_hold_campaign.obr_name,
                self.preventive_on_hold_campaign.obr_name,
                self.preventive_test_on_hold_campaign.obr_name,
            ],
        )
        # on hold + show_test=false (explicit)
        response = self.client.get(f"{URL}?campaign_category=on_hold&on_hold=true&show_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertEqual(len(result), 3)
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
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
        self.assertEqual(len(result), 3)
        obr_names = [cmp["obr_name"] for cmp in result]
        self.assertCountEqual(
            obr_names,
            [
                self.on_hold_campaign.obr_name,
                self.campaign_with_on_hold_round.obr_name,  # has round on hold
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
