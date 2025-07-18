from iaso.models.base import Account
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.test import APITestCase
from plugins.polio import permissions as polio_permissions
from plugins.polio.models import Campaign, Round


class SupplyChainDashboardsAPITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/polio/dashboards/rounds/"
        cls.account = Account.objects.create(name="test account")
        cls.other_account = Account.objects.create(name="other account")
        cls.authorized_user = cls.create_user_with_profile(
            username="authorized",
            account=cls.account,
            permissions=[
                polio_permissions._POLIO,
            ],
        )
        cls.authorized_user_admin = cls.create_user_with_profile(
            username="authorized_admin",
            account=cls.account,
            permissions=[
                polio_permissions._POLIO_CONFIG,
            ],
        )
        cls.unauthorized_user = cls.create_user_with_profile(
            username="unAuthorized", account=cls.account, permissions=[]
        )
        # We need the org unit type to be able to use campaign.country
        cls.country_type = OrgUnitType.objects.create(name="country", category="COUNTRY")
        cls.country = OrgUnit.objects.create(name="Outsiplou", org_unit_type=cls.country_type)
        cls.campaign = Campaign.objects.create(
            obr_name="Outsiplou-2024", account=cls.account, initial_org_unit=cls.country
        )
        cls.other_campaign = Campaign.objects.create(obr_name="Not the expected result", account=cls.other_account)
        cls.round = Round.objects.create(campaign=cls.campaign)
        cls.other_round = Round.objects.create(campaign=cls.other_campaign)

    def test_user_has_permission(self):
        self.client.force_authenticate(self.unauthorized_user)
        response = self.client.get(self.url)
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user)
        response = self.client.get(self.url)
        self.assertJSONResponse(response, 200)

        self.client.force_authenticate(self.authorized_user_admin)
        response = self.client.get(self.url)
        self.assertJSONResponse(response, 200)

    def test_reponse_filtered_by_account(self):
        self.client.force_authenticate(self.authorized_user)
        response = self.client.get(self.url)
        jr = self.assertJSONResponse(response, 200)
        results = jr["results"]
        self.assertEqual(len(results), 1)
        round = results[0]
        self.assertEqual(round["id"], self.round.pk)
