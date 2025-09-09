from iaso.models.base import Group
from iaso.test import APITestCase
from plugins.polio.models import VACCINES, CampaignType
from plugins.polio.tests.api.test import PolioTestCaseMixin


CALENDAR_URL = "/api/polio/campaigns/?order=first_round_started_at&campaign_types=polio&campaign_category=all&show_test=false&enabled=true&fieldset=calendar"


class CampaignCalendarTestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data source", account_name="Account", project_name="Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(account=cls.account, permissions=["iaso_polio"])
        cls.country_type = cls.create_org_unit_type(name="COUNTRY", category="COUNTRY", projects=[cls.project])
        cls.district_type = cls.create_org_unit_type(name="DISTRICT", category="DISTRICT", projects=[cls.project])

        # Campaign types
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.measles_type = CampaignType.objects.get(name=CampaignType.MEASLES)

        # Campaign
        cls.campaign, cls.rnd1, cls.rnd2, cls.rnd3, cls.country, cls.district = cls.create_campaign(
            obr_name="Polio Campaign",
            account=cls.account,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
            country_name="Testland",
            district_name="District 9",
            source_version=cls.source_version,
        )
        cls.campaign.campaign_types.set([cls.polio_type])

        cls.rnd1_subactivity1 = cls.create_sub_activity(
            rnd=cls.rnd1, name="SubActivity1", start_date=cls.rnd1.started_at, end_date=cls.rnd1.ended_at
        )
        cls.add_sub_activity_scope(
            sub_activity=cls.rnd1_subactivity1,
            org_units=[cls.district],
            vaccine=VACCINES[2][0],
            source_version=cls.source_version,
        )

    def test_anon_user_has_access(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(
            CALENDAR_URL,
            format="json",
        )
        self.assertJSONResponse(response, 200)

    def test_logged_user_has_access(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            CALENDAR_URL,
            format="json",
        )
        self.assertJSONResponse(response, 200)

    def test_response_shape(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            CALENDAR_URL,
        )
        response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response), 1)
        campaign = response[0]

        self.assertEqual(campaign["obr_name"], self.campaign.obr_name)
        self.assertEqual(campaign["id"], self.campaign.id.__str__())
        self.assertEqual(campaign["epid"], self.campaign.epid)
        self.assertEqual(campaign["account"], self.account.pk)
        self.assertEqual(campaign["top_level_org_unit_name"], self.country.name)
        self.assertEqual(campaign["top_level_org_unit_id"], self.country.pk)
        self.assertEqual(campaign["is_preventive"], self.campaign.is_preventive)
        self.assertEqual(campaign["grouped_campaigns"], list(self.campaign.grouped_campaigns.all()))
        self.assertEqual(campaign["general_status"], "Round 3 ended")
        self.assertEqual(campaign["separate_scopes_per_round"], self.campaign.separate_scopes_per_round)
        self.assertEqual(len(campaign["rounds"]), 3)
        self.assertEqual(len(campaign["sub_activities"]), 1)
        self.assertEqual(len(campaign["scopes"]), 1)
        self.assertEqual(campaign["vaccines"], VACCINES[0][0])
        self.assertEqual(campaign["single_vaccines"], VACCINES[0][0])
        self.assertEqual(campaign["description"], self.campaign.description)
        self.assertEqual(campaign["is_test"], self.campaign.is_test)
        self.assertEqual(len(campaign["campaign_types"]), 1)
        self.assertEqual(campaign["campaign_types"][0]["name"], self.polio_type.name)

    def test_response_has_rounds(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            CALENDAR_URL,
        )
        response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response), 1)
        rounds = response[0]["rounds"]
        self.assertEqual(len(rounds), 3)

        def assertRound(rnd, ref_round):
            self.assertEqual(rnd["number"], ref_round.number)
            self.assertEqual(rnd["started_at"], ref_round.started_at.strftime("%Y-%m-%d"))
            self.assertEqual(rnd["ended_at"], ref_round.ended_at.strftime("%Y-%m-%d"))
            self.assertEqual(rnd["id"], ref_round.pk)

        round1 = rounds[0]
        round2 = rounds[1]
        round3 = rounds[2]
        assertRound(rnd=round1, ref_round=self.rnd1)
        assertRound(rnd=round2, ref_round=self.rnd2)
        assertRound(rnd=round3, ref_round=self.rnd3)

    def test_response_has_subactivities(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            CALENDAR_URL,
        )
        response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response), 1)
        sub_activities = response[0]["sub_activities"]
        self.assertEqual(len(sub_activities), 1)
        sub_activity = sub_activities[0]
        self.assertEqual(sub_activity["id"], self.rnd1_subactivity1.pk)
        self.assertEqual(sub_activity["name"], self.rnd1_subactivity1.name)
        self.assertEqual(sub_activity["round_number"], self.rnd1.number)
        self.assertEqual(sub_activity["start_date"], self.rnd1_subactivity1.start_date.strftime("%Y-%m-%d"))
        self.assertEqual(sub_activity["end_date"], self.rnd1_subactivity1.end_date.strftime("%Y-%m-%d"))
        self.assertEqual(sub_activity["vaccine_names"], VACCINES[2][0])
        self.assertEqual(
            sub_activity["scopes"][0]["group"]["id"],
            Group.objects.filter(subactivityScope__subactivity=self.rnd1_subactivity1).first().id,
        )
        self.assertEqual(sub_activity["scopes"][0]["vaccine"], VACCINES[2][0])

    def test_scopes(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            CALENDAR_URL,
        )
        response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response), 1)
        campaign = response[0]
        scopes = campaign["scopes"]
        self.assertEqual(len(scopes), 1)
        scope = scopes[0]
        self.assertEqual(scope["vaccine"], VACCINES[0][0])
        self.assertEqual(
            scope["group"]["id"], Group.objects.filter(campaignScope__campaign__id=campaign["id"]).first().id
        )
