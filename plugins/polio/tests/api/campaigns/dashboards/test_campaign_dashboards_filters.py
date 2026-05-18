from rest_framework.status import HTTP_200_OK

from iaso.models.base import Group
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from plugins.polio.models.base import Campaign, CampaignGroup, CampaignType
from plugins.polio.tests.api.campaigns.setupData import CampaignFiltersTestBase


URL = "/api/polio/dashboards/campaigns/"


class CampaignDashboardsFiltersTestCase(CampaignFiltersTestBase):
    def test_no_filter_params(self):
        """
        All filters return the base queryset if left empty.
        This is not the same behaviour as the main campaigns endpoint which filters out test and on hold campaigns by default
        """
        expected_obr_names = [
            self.regular_campaign.obr_name,
            self.preventive_campaign.obr_name,
            self.planned_campaign.obr_name,
            self.planned_preventive_campaign.obr_name,
            self.campaign_with_on_hold_round.obr_name,
            self.test_campaign.obr_name,
            self.on_hold_campaign.obr_name,
            self.planned_test_campaign.obr_name,
            self.preventive_on_hold_campaign.obr_name,
            self.preventive_test_campaign.obr_name,
            self.preventive_test_on_hold_campaign.obr_name,
            self.planned_preventive_test_campaign.obr_name,
            self.test_on_hold_campaign.obr_name,
        ]  # using to obr_names to avoid having to cast UUID to string

        self.client.force_authenticate(self.user)
        # not passing the query params returns all campaigns
        response = self.client.get(f"{URL}?limit=20&page=1")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
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
        response_data = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(response_data["campaigns"]), 1)
        self.assertEqual(response_data["campaigns"][0]["id"], str(campaign1.id))

        # Filter by single campaign type using slug
        response = self.client.get(f"{URL}?campaign_types={campaign_type1.slug}", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(response_data["campaigns"]), 1)
        self.assertEqual(response_data["campaigns"][0]["id"], str(campaign1.id))

        # Filter by multiple campaign types
        response = self.client.get(
            f"{URL}?campaign_types={campaign_type1.id},{campaign_type2.id}",
            format="json",
        )
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(response_data["campaigns"]), 2)
        campaign_ids = [campaign["id"] for campaign in response_data["campaigns"]]
        self.assertIn(str(campaign1.id), campaign_ids)
        self.assertIn(str(campaign2.id), campaign_ids)

        # Filter by multiple campaign types
        response = self.client.get(
            f"{URL}?campaign_types={campaign_type1.slug},{campaign_type2.slug}",
            format="json",
        )
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(response_data["campaigns"]), 2)
        campaign_ids = [campaign["id"] for campaign in response_data["campaigns"]]
        self.assertIn(str(campaign1.id), campaign_ids)
        self.assertIn(str(campaign2.id), campaign_ids)

        # Filter by non-existing campaign type
        response = self.client.get(f"{URL}?campaign_types=9999", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(response_data["campaigns"]), 0)

        # Filter by non-existing campaign type
        response = self.client.get(f"{URL}?campaign_types=UNKNOWN_CAMPAIGN_TYPE", format="json")
        response_data = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(response_data["campaigns"]), 0)

    def test_filter_test_campaigns(self):
        self.client.force_authenticate(self.user)
        initial_count = Campaign.objects.count()
        initial_non_test_campaigns_count = Campaign.objects.filter(is_test=False).count()

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
        response = self.client.get(f"{URL}?is_test=true")
        result = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(result["campaigns"]), initial_count + 2)  # +2 new campaigns created
        obr_names = [r["obr_name"] for r in result["campaigns"]]
        self.assertIn(payload1["obr_name"], obr_names)

        # return test campaigns by default
        response = self.client.get(f"{URL}")
        result = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(result["campaigns"]), initial_count + 2)  # +2 new campaigns created
        obr_names = [r["obr_name"] for r in result["campaigns"]]
        self.assertIn(payload1["obr_name"], obr_names)

        # return non test campaigns
        response = self.client.get(f"{URL}?is_test=false")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [r["obr_name"] for r in result["campaigns"]]
        self.assertEqual(len(result["campaigns"]), initial_non_test_campaigns_count + 1)
        self.assertNotIn(payload1["obr_name"], obr_names)
        self.assertFalse(result["campaigns"][0]["is_test"])

    def test_filter_on_hold(self):
        pass

    def test_filter_preventive(self):
        pass

    def test_filter_planned(self):
        pass

    def test_boolean_filters_combinations(self):
        pass

    def test_filter_by_deletion_status(self):
        self.client.force_authenticate(self.user)

        new_ids = self._create_multiple_campaigns(10)

        total_campaigns = Campaign.objects.count()

        # Delete first 8 campaigns
        deleted_count = 0
        for c_id in new_ids[:8]:
            self.client.delete(f"/api/polio/campaigns/{c_id}/")
            deleted_count += 1

        response = self.client.get(f"{URL}?deletion_status=deleted", format="json")

        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result["campaigns"]), deleted_count)

        # test that it returns all
        response = self.client.get(f"{URL}?deletion_status=all&limit=50&page=1")
        result = self.assertJSONResponse(response, HTTP_200_OK)

        self.assertEqual(len(result["campaigns"]), total_campaigns)

        # By default it return undeleted, i.e "active"
        # Calculate remaining visible campaigns after deletion
        remaining_visible = Campaign.objects.filter(deleted_at__isnull=True).count()

        response = self.client.get(f"{URL}", format="json")

        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result["campaigns"]), remaining_visible)

        # filter on active
        response = self.client.get(f"{URL}?deletion_status=active", format="json")

        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result["campaigns"]), remaining_visible)

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

        # not passing the query params returns campaigns from all categories
        response = self.client.get(f"{URL}?search=plann")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
        self.assertCountEqual(expected_obr_names, obr_names)

        # filter is case insensitive
        response = self.client.get(f"{URL}?search=pLanN")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
        self.assertCountEqual(expected_obr_names, obr_names)

        self.client.force_authenticate(geo_limited_user)
        # test search geo limited
        response = self.client.get(
            f"{URL}?search=plann"
        )  # would return planned campaigns, geo-limited user can't see them, only the campaign with the matching EPID
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result["campaigns"]), 1)
        self.assertEqual(result["campaigns"][0]["epid"], campaign_with_epid.epid)

        response = self.client.get(f"{URL}?search=campaign")
        result = self.assertJSONResponse(response, HTTP_200_OK)  # returns only the campaigns the user has access to
        obr_names = [r["obr_name"] for r in result["campaigns"]]
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

        # not passing the query params returns campaigns from all categories
        response = self.client.get(f"{URL}?org_unit_groups={country_group.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
        self.assertCountEqual(obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name])

        # test passing comma-separated group ids
        response = self.client.get(f"{URL}?org_unit_groups={country_group.id},{country_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
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
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
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
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
        self.assertCountEqual(obr_names, [self.regular_campaign.obr_name, regular_campaign2.obr_name])

        # test passing comma-separated group ids
        response = self.client.get(f"{URL}?campaign_groups={campaign_group.id},{campaign_group2.id}")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
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
        obr_names = [cmp["obr_name"] for cmp in result["campaigns"]]
        self.assertCountEqual(obr_names, [regular_campaign2.obr_name, regular_campaign3.obr_name])
