from iaso import models as m
from iaso.test import TestCase

from plugins.polio.models import Campaign, CampaignType


class CampaignTestCase(TestCase):
    """
    Test Campaign model.
    """

    @classmethod
    def setUpTestData(cls):
        # User.
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
            permissions=["iaso_polio_budget"],
        )

        # Campaigns types.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.measles_type = CampaignType.objects.get(name=CampaignType.MEASLES)

        # Campaigns.
        cls.polio_campaign = Campaign.objects.create(obr_name="Polio", account=cls.account)
        cls.polio_campaign.campaign_types.set([cls.polio_type])
        cls.measles_campaign = Campaign.objects.create(obr_name="Measles", account=cls.account)
        cls.measles_campaign.campaign_types.set([cls.measles_type])

    def test_polio_campaign_manager(self):
        self.assertEqual(Campaign.objects.count(), 2)
        self.assertEqual(Campaign.polio_objects.count(), 1)

        polio_campaign = Campaign.polio_objects.first()
        self.assertEqual(polio_campaign.campaign_types.first().name, CampaignType.POLIO)
