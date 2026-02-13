import datetime

from unittest.mock import patch

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from iaso import models as m
from iaso.models import Account
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase
from plugins.polio.models import Campaign, CampaignScope, ReasonForDelay, Round
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tasks.weekly_email import compute_values, send_notification_email


class WeeklyEMailTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = m.DataSource.objects.create(name="Default source")
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
            onset_at=timezone.now(),
            account=self.account,
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=timezone.now(),
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
            onset_at=timezone.now(),
            account=self.account,
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="ABC",
            country=self.org_unit,
            onset_at=timezone.now(),
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
        round1 = Round.objects.create(started_at=datetime.date(2022, 9, 12), number=1, target_population=100)

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="cVDPV2",
            country=self.org_unit,
            onset_at=timezone.now().date(),
            account=self.account,
            cvdpv2_notified_at=datetime.date(2022, 9, 12),
        )

        campaign_active.rounds.set([round1])

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        self.recipient.email = "recipienttest@recipientpoliotest.io"
        self.recipient.save()
        campaign_active.save()

        self.assertTrue(send_notification_email(campaign_active))

    @patch("plugins.polio.tasks.weekly_email.now")
    def test_computed_values(self, mock_now):
        now = timezone.make_aware(datetime.datetime(2022, 10, 13))
        mock_now.return_value = now
        round1 = Round.objects.create(
            started_at=datetime.date(2022, 9, 12),
            number=1,
            target_population=100,
            preparedness_spreadsheet_url="https://example.com/prep-round1",
        )
        round2 = Round.objects.create(
            started_at=datetime.date(2022, 10, 20),
            number=2,
            target_population=99,
            preparedness_spreadsheet_url="https://example.com/prep-round2",
        )

        campaign_active = Campaign(
            obr_name="active campaign",
            detection_status="PENDING",
            virus="cVDPV2",
            country=self.org_unit,
            onset_at=timezone.now().date(),
            account=self.account,
            cvdpv2_notified_at=datetime.date(2022, 9, 12),
            risk_assessment_rrt_oprtt_approval_at=datetime.date(2022, 9, 15),
            submitted_to_rrt_at_WFEDITABLE=datetime.date(2022, 9, 20),
        )

        campaign_active.rounds.set([round1, round2])
        campaign_active.save()

        # Create a campaign scope with a vaccine for vaccines_extended
        campaign_scope = CampaignScope.objects.create(campaign=campaign_active, vaccine="mOPV2")
        campaign_scope.group.org_units.set([self.child_org_unit])

        country_user_grp = CountryUsersGroup(country=self.org_unit)
        country_user_grp.save()

        users = User.objects.all()
        country_user_grp.users.set(users)

        (
            prep_national,
            prep_district,
            prep_regional,
            next_round_date,
            next_round_number,
            next_round_days_left,
            next_round_preparedness_spreadsheet_url,
            target_population,
            cvdpv2_notified_at,
            vaccines_extended,
            risk_assessment_rrt_oprtt_approval_at,
            submitted_to_rrt_at_WFEDITABLE,
            obr_name,
        ) = compute_values(campaign_active)

        # All values are from round 2 (not round 1)
        self.assertEqual(next_round_date, round2.started_at)
        self.assertEqual(next_round_number, round2.number)
        self.assertEqual(target_population, str(round2.target_population))
        self.assertEqual(next_round_days_left, 7)  # 2022-10-20 - 2022-10-13 = 7 days
        self.assertEqual(next_round_preparedness_spreadsheet_url, round2.preparedness_spreadsheet_url)

        # Preparedness values are "N/A" since we don't have any values in cache
        self.assertEqual(prep_national, "N/A")
        self.assertEqual(prep_regional, "N/A")
        self.assertEqual(prep_district, "N/A")

        # Campaign-level fields
        self.assertEqual(cvdpv2_notified_at, campaign_active.cvdpv2_notified_at)
        self.assertEqual(vaccines_extended, campaign_active.vaccines_extended)
        self.assertEqual(risk_assessment_rrt_oprtt_approval_at, campaign_active.risk_assessment_rrt_oprtt_approval_at)
        self.assertEqual(submitted_to_rrt_at_WFEDITABLE, campaign_active.submitted_to_rrt_at_WFEDITABLE)
        self.assertEqual(obr_name, campaign_active.obr_name)
