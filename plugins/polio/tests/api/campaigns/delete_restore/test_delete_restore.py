from django.utils import timezone
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


class DeleteRestoreAPITestCase(APITestCase, PolioTestCaseMixin):
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
        cls.user = cls.create_user_with_profile(
            username="yoda", account=polio_account, permissions=[CORE_FORMS_PERMISSION]
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
            username="luke",
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

    def test_soft_delete_campaign(self):
        campaign = Campaign(obr_name="test_soft_delete", detection_status="PENDING", account=self.account)
        campaign.save()
        campaign.delete()
        last_campaign = Campaign.objects.last()
        self.assertEqual(last_campaign, campaign)

    def test_restore_deleted_campaign(self):
        self._create_multiple_campaigns(1)
        campaign = Campaign.objects.get()

        payload = {"id": campaign.id}

        if campaign.deleted_at is None:
            self.client.delete(f"/api/polio/campaigns/{campaign.id}/")
            self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")

        restored_campaign = Campaign.objects.get(id=campaign.id)
        self.assertIsNone(restored_campaign.deleted_at)

    def test_restore_active_campaign_returns_400(self):
        self._create_multiple_campaigns(1)
        campaign = Campaign.objects.get()

        payload = {"id": campaign.id}

        response = self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_restore_non_existent_campaign_returns_404(self):
        self.client.force_authenticate(self.user)
        payload = {"id": "bd656a6b-f67e-4a1e-95ee-1bef8f36239a"}
        response = self.client.patch("/api/polio/campaigns/restore_deleted_campaigns/", payload, format="json")
        self.assertEqual(response.status_code, 404)
