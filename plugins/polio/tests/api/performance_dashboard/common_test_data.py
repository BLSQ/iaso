import datetime

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models import performance_dashboard as p
from plugins.polio.permissions import (
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_READ_ONLY_PERMISSION,
)


class PerformanceDashboardAPIBase(APITestCase):
    """ "
    Creating the test data for the performance dashboard API
    """

    PERFORMANCE_DASHBOARD_API_URL = "/api/polio/performance_dashboard/"

    @classmethod
    def setUpTestData(cls):
        # Main Account
        cls.datasource_one = m.DataSource.objects.create(name="Datasource one")
        cls.datasource_version_one = m.SourceVersion.objects.create(data_source=cls.datasource_one, number=1)
        cls.account_one = m.Account.objects.create(name="Account1", default_version=cls.datasource_version_one)
        cls.app_id = "com.app_id.app"
        cls.project = m.Project.objects.create(name="Project", account=cls.account_one, app_id=cls.app_id)
        cls.datasource_one.projects.set([cls.project])

        # Users for the main account

        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account_one, language="en", is_superuser=True
        )

        cls.user_admin_1 = cls.create_user_with_profile(
            username="user_admin_1",
            account=cls.account_one,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        cls.user_admin_2 = cls.create_user_with_profile(
            username="user_admin_2",
            account=cls.account_one,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        cls.user_read_only_1 = cls.create_user_with_profile(
            username="user_read_only_1",
            account=cls.account_one,
            permissions=[POLIO_PERFORMANCE_READ_ONLY_PERMISSION],
        )

        cls.user_non_admin_1 = cls.create_user_with_profile(
            username="kakashi",
            account=cls.account_one,
            permissions=[POLIO_PERFORMANCE_NON_ADMIN_PERMISSION],
        )

        # User with no permissions
        cls.user_no_permissions_1 = cls.create_user_with_profile(
            username="user_no_permissions_1", account=cls.account_one, permissions=[]
        )

        # A second account for data isolation tests
        cls.account_two = m.Account.objects.create(name="account2", default_version=cls.datasource_version_one)
        cls.user_with_account2 = cls.create_user_with_profile(
            username="user_with_account2",
            account=cls.account_two,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # Org Units
        org_unit_type_country = m.OrgUnitType.objects.create(name="Country", category="COUNTRY")
        org_unit_type_block = m.OrgUnitType.objects.create(name="Region", category="REGION")

        cls.west = m.OrgUnit.objects.create(name="west", org_unit_type=org_unit_type_block)
        cls.east = m.OrgUnit.objects.create(name="east", org_unit_type=org_unit_type_country, parent=cls.west)
        cls.north = m.OrgUnit.objects.create(name="north", org_unit_type=org_unit_type_block)
        cls.south = m.OrgUnit.objects.create(name="south", org_unit_type=org_unit_type_country, parent=cls.north)

        cls.dashboard_1 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.west,
            date=datetime.date(2025, 10, 10),
            status="draft",
            vaccine="bOPV",
        )

        cls.dashboard_2 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.east,
            date=datetime.date(2025, 10, 10),
            status="commented",
            vaccine="bOPV",
        )
        cls.dashboard_3 = p.PerformanceDashboard.objects.create(
            account=cls.account_two,
            country=cls.south,
            date=datetime.date(2025, 10, 10),
            status="commented",
            vaccine="bOPV",
        )

        cls.dashboard_4 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.west,
            date=datetime.date(2025, 10, 10),
            status="final",
            vaccine="nOPV2",
        )

        cls.dashboard_5 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.west,
            date=datetime.date(2025, 10, 10),
            status="final",
            vaccine="nOPV2",
        )

        cls.dashboard_6 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.west,
            date=datetime.date(2025, 10, 10),
            status="final",
            vaccine="nOPV2",
        )
        cls.dashboard_7 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.east,
            date=datetime.date(2025, 10, 10),
            status="commented",
            vaccine="nOPV2",
        )
        cls.dashboard_8 = p.PerformanceDashboard.objects.create(
            account=cls.account_one,
            country=cls.south,
            date=datetime.date(2025, 10, 10),
            status="draft",
            vaccine="nOPV2",
        )
