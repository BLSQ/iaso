import datetime

import time_machine

from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, IasoTestCaseMixin
from plugins.polio.api.calendar.filter import (
    QUARTER_DELTA,
    SEMESTER,
    SEMESTER_DELTA,
    YEAR,
    YEAR_DELTA,
    CalendarPeriodFilterBackend,
)
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


URL = "/api/polio/calendar/"
NOW = datetime.datetime(2026, 1, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(NOW, tick=False)
class CalendarFiltersAPITestCase(APITestCase, IasoTestCaseMixin, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.now = NOW
        cls.account, cls.data_source, cls.source_version_1, _ = cls.create_account_datasource_version_project(
            source_name="Default source", account_name="polio", project_name="polio", app_id="com.polio.app"
        )

        cls.other_account = m.Account.objects.create(name="Other account")
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=m.OrgUnitType.objects.create(name="Org Unit Type A", short_name="Cnc"),
            version=cls.source_version_1,
            name="Org Unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=m.OrgUnitType.objects.create(name="Org Unit child type", short_name="Cnc"),
            version=cls.source_version_1,
            name="Child Org Unit",
            parent_id=cls.org_unit.id,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.user_no_permission = cls.create_user_with_profile(
            username="user_no_permission",
            account=cls.account,
            permissions=[CORE_FORMS_PERMISSION],
            org_units=[cls.child_org_unit],
        )

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country", category="COUNTRY")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district")

        (
            cls.reference_campaign,
            cls.reference_campaign_rnd1,
            cls.reference_campaign_rnd2,
            cls.reference_campaign_rnd3,
            cls.country1,
            _,
        ) = cls.create_campaign(
            obr_name="reference campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.reference_campaign_rnd1.started_at = NOW - datetime.timedelta(days=5)
        cls.reference_campaign_rnd1.ended_at = NOW
        cls.reference_campaign_rnd1.save()
        cls.reference_campaign_rnd2.started_at = NOW + datetime.timedelta(days=2)
        cls.reference_campaign_rnd2.ended_at = NOW + datetime.timedelta(days=4)
        cls.reference_campaign_rnd2.save()
        cls.reference_campaign_rnd3.started_at = NOW + datetime.timedelta(days=6)
        cls.reference_campaign_rnd3.ended_at = NOW + datetime.timedelta(days=8)
        cls.reference_campaign_rnd3.save()

        (
            cls.quarter_early_campaign,
            cls.quarter_early_campaign_rnd1,
            cls.quarter_early_campaign_rnd2,
            cls.quarter_early_campaign_rnd3,
            cls.country2,
            _,
        ) = cls.create_campaign(
            obr_name="Quarter early",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.quarter_early_campaign_rnd1.started_at = NOW - QUARTER_DELTA - datetime.timedelta(days=12)
        cls.quarter_early_campaign_rnd1.ended_at = NOW - QUARTER_DELTA - datetime.timedelta(days=9)
        cls.quarter_early_campaign_rnd1.save()
        cls.quarter_early_campaign_rnd2.started_at = NOW - QUARTER_DELTA - datetime.timedelta(days=8)
        cls.quarter_early_campaign_rnd2.ended_at = NOW - QUARTER_DELTA - datetime.timedelta(days=5)
        cls.quarter_early_campaign_rnd2.save()
        cls.quarter_early_campaign_rnd3.started_at = NOW - QUARTER_DELTA - datetime.timedelta(days=4)
        cls.quarter_early_campaign_rnd3.ended_at = NOW - QUARTER_DELTA - datetime.timedelta(days=1)
        cls.quarter_early_campaign_rnd3.save()

        (
            cls.quarter_late_campaign,
            cls.quarter_late_campaign_rnd1,
            cls.quarter_late_campaign_rnd2,
            cls.quarter_late_campaign_rnd3,
            cls.country3,
            _,
        ) = cls.create_campaign(
            obr_name="Quarter late",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.quarter_late_campaign_rnd1.started_at = NOW + QUARTER_DELTA + datetime.timedelta(days=4)
        cls.quarter_late_campaign_rnd1.ended_at = NOW + QUARTER_DELTA + datetime.timedelta(days=1)
        cls.quarter_late_campaign_rnd1.save()
        cls.quarter_late_campaign_rnd3.started_at = NOW + QUARTER_DELTA + datetime.timedelta(days=12)
        cls.quarter_late_campaign_rnd3.ended_at = NOW + QUARTER_DELTA + datetime.timedelta(days=9)
        cls.quarter_late_campaign_rnd3.save()
        cls.quarter_late_campaign_rnd2.started_at = NOW + QUARTER_DELTA + datetime.timedelta(days=8)
        cls.quarter_late_campaign_rnd2.ended_at = NOW + QUARTER_DELTA + datetime.timedelta(days=5)
        cls.quarter_late_campaign_rnd2.save()

        (
            cls.semester_early_campaign,
            cls.semester_early_campaign_rnd1,
            cls.semester_early_campaign_rnd2,
            cls.semester_early_campaign_rnd3,
            cls.country4,
            _,
        ) = cls.create_campaign(
            obr_name="Semester early",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.semester_early_campaign_rnd1.started_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=12)
        cls.semester_early_campaign_rnd1.ended_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=9)
        cls.semester_early_campaign_rnd1.save()
        cls.semester_early_campaign_rnd2.started_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=8)
        cls.semester_early_campaign_rnd2.ended_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=5)
        cls.semester_early_campaign_rnd2.save()
        cls.semester_early_campaign_rnd3.started_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=4)
        cls.semester_early_campaign_rnd3.ended_at = NOW - SEMESTER_DELTA - datetime.timedelta(days=1)
        cls.semester_early_campaign_rnd3.save()

        (
            cls.semester_late_campaign,
            cls.semester_late_campaign_rnd1,
            cls.semester_late_campaign_rnd2,
            cls.semester_late_campaign_rnd3,
            cls.country5,
            _,
        ) = cls.create_campaign(
            obr_name="Semester late",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.semester_late_campaign_rnd1.started_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=4)
        cls.semester_late_campaign_rnd1.ended_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=1)
        cls.semester_late_campaign_rnd1.save()
        cls.semester_late_campaign_rnd3.started_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=12)
        cls.semester_late_campaign_rnd3.ended_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=9)
        cls.semester_late_campaign_rnd3.save()
        cls.semester_late_campaign_rnd2.started_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=8)
        cls.semester_late_campaign_rnd2.ended_at = NOW + SEMESTER_DELTA + datetime.timedelta(days=5)
        cls.semester_late_campaign_rnd2.save()

        (
            cls.year_early_campaign,
            cls.year_early_campaign_rnd1,
            cls.year_early_campaign_rnd2,
            cls.year_early_campaign_rnd3,
            cls.country6,
            _,
        ) = cls.create_campaign(
            obr_name="Year early",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.year_early_campaign_rnd1.started_at = NOW - YEAR_DELTA - datetime.timedelta(days=12)
        cls.year_early_campaign_rnd1.ended_at = NOW - YEAR_DELTA - datetime.timedelta(days=9)
        cls.year_early_campaign_rnd1.save()
        cls.year_early_campaign_rnd2.started_at = NOW - YEAR_DELTA - datetime.timedelta(days=8)
        cls.year_early_campaign_rnd2.ended_at = NOW - YEAR_DELTA - datetime.timedelta(days=5)
        cls.year_early_campaign_rnd2.save()
        cls.year_early_campaign_rnd3.started_at = NOW - YEAR_DELTA - datetime.timedelta(days=4)
        cls.year_early_campaign_rnd3.ended_at = NOW - YEAR_DELTA - datetime.timedelta(days=1)
        cls.year_early_campaign_rnd3.save()

        (
            cls.year_late_campaign,
            cls.year_late_campaign_rnd1,
            cls.year_late_campaign_rnd2,
            cls.year_late_campaign_rnd3,
            cls.country7,
            _,
        ) = cls.create_campaign(
            obr_name="year late",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.year_late_campaign_rnd1.started_at = NOW + YEAR_DELTA + datetime.timedelta(days=4)
        cls.year_late_campaign_rnd1.ended_at = NOW + YEAR_DELTA + datetime.timedelta(days=1)
        cls.year_late_campaign_rnd1.save()
        cls.year_late_campaign_rnd3.started_at = NOW + YEAR_DELTA + datetime.timedelta(days=12)
        cls.year_late_campaign_rnd3.ended_at = NOW + YEAR_DELTA + datetime.timedelta(days=9)
        cls.year_late_campaign_rnd3.save()
        cls.year_late_campaign_rnd2.started_at = NOW + YEAR_DELTA + datetime.timedelta(days=8)
        cls.year_late_campaign_rnd2.ended_at = NOW + YEAR_DELTA + datetime.timedelta(days=5)
        cls.year_late_campaign_rnd2.save()

    def setUp(self):
        self.filter_backend = CalendarPeriodFilterBackend()

    def _request(self, url=URL, query_params=None):
        factory = APIRequestFactory()
        request = factory.get(url, query_params)
        return Request(request)

    def test_filter_period_empty_params(self):
        request = self._request()
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        # applies default values: date = NOW, period=QUARTER, so only reference campaign is in the queryset
        self.assertTrue(filtered_queryset.filter(id=self.reference_campaign.id).exists())

        self.assertFalse(filtered_queryset.filter(id=self.quarter_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.quarter_late_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.semester_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.semester_late_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.year_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.year_late_campaign.id).exists())
        self.assertEqual(filtered_queryset.count(), 1)

    def test_semester_period_type(self):
        request = self._request(query_params={"period_type": f"{SEMESTER}"})
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertTrue(filtered_queryset.filter(id=self.reference_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.quarter_early_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.quarter_late_campaign.id).exists())

        self.assertFalse(filtered_queryset.filter(id=self.semester_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.semester_late_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.year_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.year_late_campaign.id).exists())
        self.assertEqual(filtered_queryset.count(), 3)

    def test_year_period_type(self):
        request = self._request(query_params={"period_type": f"{YEAR}"})
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)

        self.assertTrue(filtered_queryset.filter(id=self.reference_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.quarter_early_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.quarter_late_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.semester_early_campaign.id).exists())
        self.assertTrue(filtered_queryset.filter(id=self.semester_late_campaign.id).exists())

        self.assertFalse(filtered_queryset.filter(id=self.year_early_campaign.id).exists())
        self.assertFalse(filtered_queryset.filter(id=self.year_late_campaign.id).exists())
        self.assertEqual(filtered_queryset.count(), 5)

    def test_filter_period_wrong_params(self):
        # logs warning errors
        # applies default params
        # returns correct data
        pass

    def test_filter_period_reference_date_only(self):
        # applies default period type
        # returns correct data
        pass

    def test_filter_period_period_type_only(self):
        # applies default reference date
        # returns correct data
        pass
