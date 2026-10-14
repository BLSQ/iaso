import datetime

from django.db import connection
from django.test.utils import CaptureQueriesContext

from iaso import models as m
from iaso.test import APITestCase, IasoTestCaseMixin
from plugins.polio import models as pm
from plugins.polio.budget.models import BudgetStep
from plugins.polio.tests.api.test import PolioTestCaseMixin


BASE_URL = "/api/polio/campaigns/?campaign_category=all&show_test=true&is_embedded=false&enabled=true"


class CampaignListQueryCountTestCase(APITestCase, IasoTestCaseMixin, PolioTestCaseMixin):
    """Guards the campaigns list against N+1 regressions.

    The endpoint once issued ~3500 queries for ~110 campaigns because several serializer
    fields ran their own query per row (vaccine lists, budget step counts, round date log
    reasons, org unit ancestors). What matters is not the absolute number — which moves with
    every legitimate change — but that it stays **flat as campaigns are added**.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="Default source", account_name="polio", project_name="polio"
        )
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)
        cls.polio_type = pm.CampaignType.objects.get(name=pm.CampaignType.POLIO)

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country", category="COUNTRY")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district", category="DISTRICT")
        # One shared country/district: campaigns of a country reuse the same org units, which
        # is what makes the ancestor lookups cacheable.
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=cls.source_version,
            name="Groland",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.district = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=cls.source_version,
            name="Groville",
            parent=cls.country,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.reason_for_delay = pm.ReasonForDelay.objects.create(
            account=cls.account, key_name="INITIAL_DATA", name_en="Initial data"
        )

    def _create_campaign(self, obr_name):
        """A campaign exercising every field that used to cost a query per row."""
        campaign = pm.Campaign.objects.create(
            obr_name=obr_name,
            account=self.account,
            country=self.country,
            initial_org_unit=self.district,
            separate_scopes_per_round=True,
        )
        campaign.campaign_types.set([self.polio_type])

        round_1 = pm.Round.objects.create(
            campaign=campaign,
            number=1,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 10),
        )
        self.add_scope_to_round(round_1, [self.district], pm.VACCINES[0][0], self.source_version)

        sub_activity = self.create_sub_activity(
            round_1, f"{obr_name} sub", datetime.date(2021, 1, 2), datetime.date(2021, 1, 3)
        )
        self.add_sub_activity_scope(sub_activity, [self.district], pm.VACCINES[1][0], self.source_version)

        pm.RoundDateHistoryEntry.objects.create(
            round=round_1, reason_for_delay=self.reason_for_delay, modified_by=self.user
        )
        BudgetStep.objects.create(campaign=campaign, created_by=self.user, transition_key="submit_budget")
        return campaign

    def _get_list(self):
        response = self.client.get(BASE_URL)
        return self.assertJSONResponse(response, 200)

    def test_query_count_does_not_grow_with_the_number_of_campaigns(self):
        self.client.force_authenticate(self.user)
        self._create_campaign("campaign-1")

        with CaptureQueriesContext(connection) as one_campaign:
            self.assertEqual(len(self._get_list()), 1)

        for index in range(2, 6):
            self._create_campaign(f"campaign-{index}")

        with CaptureQueriesContext(connection) as five_campaigns:
            self.assertEqual(len(self._get_list()), 5)

        self.assertEqual(
            len(five_campaigns.captured_queries),
            len(one_campaign.captured_queries),
            "Serializing five campaigns must cost the same number of queries as one. "
            "A field that queries per row has been (re)introduced:\n"
            + "\n".join(q["sql"][:120] for q in five_campaigns.captured_queries),
        )

    def test_payload_is_unchanged_by_the_prefetching(self):
        """A faster endpoint that drops data is not a win — pin the fields that were optimised."""
        self.client.force_authenticate(self.user)
        campaign = self._create_campaign("campaign-1")

        data = self._get_list()[0]

        self.assertEqual(data["obr_name"], "campaign-1")
        # vaccines come from the round scope; sub-activity vaccines are excluded from `vaccines`
        self.assertEqual(data["vaccines"], pm.VACCINES[0][0])
        self.assertEqual(data["single_vaccines"], pm.VACCINES[0][0])
        self.assertTrue(data["has_data_in_budget_tool"])
        self.assertEqual(data["campaign_types"], [self.polio_type.id])
        self.assertEqual(data["top_level_org_unit_name"], self.country.name)
        self.assertEqual(data["org_unit"]["id"], self.district.id)
        self.assertEqual(data["org_unit"]["root"]["id"], self.country.id)
        self.assertEqual(data["org_unit"]["country_parent"]["id"], self.country.id)
        self.assertEqual(data["rounds"][0]["datelogs"][0]["reason_for_delay"], self.reason_for_delay.key_name)
        self.assertEqual(campaign.budget_steps.count(), 1)

    def test_has_data_in_budget_tool_without_the_annotation(self):
        """The serializer is also used on querysets that don't annotate `has_budget_steps`."""
        from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer

        campaign = self._create_campaign("campaign-1")
        unannotated = pm.Campaign.objects.get(pk=campaign.pk)
        self.assertFalse(hasattr(unannotated, "has_budget_steps"))

        serializer = CampaignSerializer(instance=unannotated)
        self.assertTrue(serializer.data["has_data_in_budget_tool"])

        BudgetStep.objects.filter(campaign=campaign).delete()
        serializer = CampaignSerializer(instance=pm.Campaign.objects.get(pk=campaign.pk))
        self.assertFalse(serializer.data["has_data_in_budget_tool"])
