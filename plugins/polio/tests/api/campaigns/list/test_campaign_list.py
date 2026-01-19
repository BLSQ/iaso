from django.utils import timezone
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account, Team
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.api.campaigns.serializers.anonymous import AnonymousCampaignSerializer
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


class CampaignListAPITestCase(APITestCase, PolioTestCaseMixin):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = timezone.now()
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = polio_account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.user = cls.create_user_with_profile(
            username="user", account=polio_account, permissions=[CORE_FORMS_PERMISSION]
        )

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district")

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

        cls.org_units = [
            cls.org_unit,
            cls.child_org_unit,
            m.OrgUnit.objects.create(
                org_unit_type=m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc"),
                version=cls.source_version_1,
                name="Jedi Council B",
                validation_status=m.OrgUnit.VALIDATION_VALID,
                source_ref="PvtAI4RUMkr",
            ),
        ]

        cls.user_no_permission = cls.create_user_with_profile(
            username="user_no_permission",
            account=polio_account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[cls.child_org_unit],
        )

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def _create_multiple_campaigns(self, count: int) -> None:
        self.client.force_authenticate(self.user)
        for n in range(count):
            payload = {
                "account": self.account.pk,
                "obr_name": f"campaign_{n}",
                "detection_status": "PENDING",
            }
            self.client.post("/api/polio/campaigns/", payload, format="json")

    def test_campaigns_list_authenticated(self):
        """Basic tests for the campaigns list endpoint (while authenticated)

        Checks
        - the endpoint exists
        - the status code
        - important data fields get returned
        """
        self.client.force_authenticate(self.user)
        user_account = self.user.iaso_profile.account
        Campaign.objects.create(account=user_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=user_account, obr_name="obr_name2", detection_status="PENDING")

        response = self.client.get("/api/polio/campaigns/")
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response), 2)

        for campaign_data in json_response:
            # Both are part of the same account
            self.assertEqual(campaign_data["account"], user_account.pk)
            # TODO: test other fields here

    def test_campaings_list_authenticated_only_get_own_account(self):
        """Campaigns list endpoint: authenticated users only see results linked to their account"""
        self.client.force_authenticate(self.user)
        user_account = self.user.iaso_profile.account

        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=user_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=user_account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(
            account=another_account,
            obr_name="obr_name_other_account",
            detection_status="PENDING",
        )

        json_response = self.client.get("/api/polio/campaigns/").json()
        self.assertEqual(len(json_response), 2)
        self.assertNotIn("obr_name_other_account", [c["obr_name"] for c in json_response])

    def test_campaigns_list_anonymous_can_choose_account(self):
        """Campaigns list endpoint: anonymous users only can use the account_id parameter to filter"""
        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(
            account=another_account,
            obr_name="obr_name_other_account",
            detection_status="PENDING",
        )

        json_response = self.client.get(f"/api/polio/campaigns/?account_id={another_account.pk}").json()
        self.assertEqual(len(json_response), 1)
        self.assertEqual(json_response[0]["obr_name"], "obr_name_other_account")

    def test_campaigns_list_anonymous_get_everything(self):
        """Campaigns list endpoint: if they don't use the account_id, anonymous users get everything"""
        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(
            account=another_account,
            obr_name="obr_name_other_account",
            detection_status="PENDING",
        )

        json_response = self.client.get("/api/polio/campaigns/").json()
        self.assertEqual(len(json_response), 3)

    def test_campaigns_list_authenticated_account_id_ignored(self):
        """Campaigns list endpoint: authenticated users cannot make use of the account_id parameter

        Notes:
            - This is a bit counterintuitive since anonymous users can BUT this is because more data fields are shown
            to authenticated users
            - in practice, no error is thrown but the account_id parameter just gets ignored
        """
        self.client.force_authenticate(self.user)
        user_account = self.user.iaso_profile.account

        another_account = Account.objects.create(name="another_account")
        Campaign.objects.create(account=user_account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=user_account, obr_name="obr_name2", detection_status="PENDING")
        Campaign.objects.create(
            account=another_account,
            obr_name="obr_name_other_account",
            detection_status="PENDING",
        )

        json_response = self.client.get(f"/api/polio/campaigns/?account_id={another_account.pk}").json()
        self.assertEqual(len(json_response), 2)
        self.assertNotIn("obr_name_other_account", [c["obr_name"] for c in json_response])

    def test_campaigns_list_anonymous(self):
        """Basic tests for the campaigns list endpoint (anonymous)

        Checks
        - the endpoint exists
        - the status code
        - important data fields get returned
        """
        Campaign.objects.create(account=self.account, obr_name="obr_name", detection_status="PENDING")
        Campaign.objects.create(account=self.account, obr_name="obr_name2", detection_status="PENDING")
        response = self.client.get("/api/polio/campaigns/")
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(len(json_response), 2)
        fields = AnonymousCampaignSerializer.Meta.fields
        for campaign_data in json_response:
            # Both are part of the same account
            self.assertEqual(campaign_data["account"], self.account.pk)
            self.assertEqual(list(campaign_data.keys()), list(fields))

    def test_can_only_see_campaigns_within_user_org_units_hierarchy(self):
        """
        Ensure a user can only see the campaigns for an org unit (or a descendent of that org unit) that was
        previously assigned to their profile
        """
        self.client.force_authenticate(self.user)
        project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=self.other_account
        )

        nopv2_team = Team.objects.create(name="NOPV2_VACCINE_TEAM_NAME", project=project, manager=self.user)

        nopv2_team.users.set([self.user.pk])

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name a",
            "detection_status": "PENDING",
            "initial_org_unit": self.org_unit.pk,
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        payload = {
            "account": self.account.pk,
            "obr_name": "obr_name b",
            "detection_status": "PENDING",
            "initial_org_unit": self.child_org_unit.pk,
        }
        self.client.force_authenticate(self.user_no_permission)
        response = self.client.post("/api/polio/campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        response = self.client.get("/api/polio/campaigns/", format="json")

        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["initial_org_unit"], self.child_org_unit.pk)
