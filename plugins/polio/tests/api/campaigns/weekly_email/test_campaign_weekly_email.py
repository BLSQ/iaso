import datetime

from typing import List

from django.contrib.auth.models import User
from django.utils.timezone import now
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import Campaign, ReasonForDelay, Round
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tasks.weekly_email import send_notification_email


class WeeklyEMailTestCase(APITestCase):
    data_source: m.DataSource
    now: datetime.datetime
    source_version_1: m.SourceVersion
    source_version_2: m.SourceVersion
    other_account: m.Account
    jedi_squad: m.OrgUnitType
    user: User
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit
    org_units: List[m.OrgUnit]
    recipient: User
    account: m.Account

    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = m.DataSource.objects.create(name="Default source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)
        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.account = Account.objects.create(name="Global Health Initiative", default_version=cls.source_version_1)
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="country")
        cls.district_type = m.OrgUnitType.objects.create(name="District", short_name="district")

        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=cls.source_version_1,
            name="Country",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=cls.source_version_1,
            name="District",
            parent_id=cls.org_unit.id,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAbfuI4RUMkr",
        )
        cls.child_org_unit2 = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=cls.source_version_1,
            name="District 2",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtghkhjkunRUMkr",
        )

        cls.org_units = [cls.org_unit, cls.child_org_unit, cls.child_org_unit2]

        cls.recipient = cls.create_user_with_profile(
            username="recipient",
            account=cls.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[cls.child_org_unit],
        )
        cls.initial_data = ReasonForDelay.objects.create(
            account=cls.account, key_name="INITIAL_DATA", name_en="Initial data", name_fr="Données initiales"
        )
        cls.cat_ate_my_homework = ReasonForDelay.objects.create(
            account=cls.account,
            key_name="CAT_ATE_MY_HOMEWORK",
            name_en="The cat ate my homework",
            name_fr="Mon chat a mangé mon devoir",
        )

    def setUp(self) -> None:
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_soft_deleted_campaign_weekly_mail(self):
        campaign_deleted = Campaign(
            obr_name="deleted_campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=now(),
            account=self.account,
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=now(),
            account=self.account,
        )

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        self.recipient.email = "recipienttest@recipientpoliotest.io"
        self.recipient.save()

        campaign_deleted.save()
        campaign_deleted.delete()
        campaign_active.save()

        self.assertFalse(send_notification_email(campaign_deleted))
        self.assertTrue(send_notification_email(campaign_active))

    def test_weekly_mail_content(self):
        campaign_deleted = Campaign(
            obr_name="deleted_campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=now(),
            account=self.account,
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=now(),
            account=self.account,
        )

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        self.recipient.email = "recipienttest@recipientpoliotest.io"
        self.recipient.save()

        campaign_deleted.save()
        campaign_deleted.delete()
        campaign_active.save()

        self.assertFalse(send_notification_email(campaign_deleted))
        self.assertTrue(send_notification_email(campaign_active))

    def test_weekly_mail_content_active_campaign(self):
        round = Round.objects.create(
            started_at=datetime.date(2022, 9, 12),
            number=1,
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="cVDPV2",
            country=self.org_unit,
            onset_at=now().date(),
            account=self.account,
            cvdpv2_notified_at=datetime.date(2022, 9, 12),
        )

        round.campaign = campaign_active
        campaign_active.rounds.set([round])

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        self.recipient.email = "recipienttest@recipientpoliotest.io"
        self.recipient.save()
        campaign_active.save()

        self.assertEqual(send_notification_email(campaign_active), True)
