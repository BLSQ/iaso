from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models.performance_thresholds import PerformanceThresholds
from plugins.polio.permissions import (
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_READ_ONLY_PERMISSION,
)


class PerformanceThresholdsAPIBase(APITestCase):
    """
    Common setup for Performance Thresholds API tests.
    Sets up accounts, users, and initial threshold data.
    """

    PERFORMANCE_THRESHOLDS_API_URL = "/api/polio/performance_thresholds/"

    @classmethod
    def setUpTestData(cls):
        # --- 1. Main Account ---
        cls.datasource = m.DataSource.objects.create(name="Datasource")
        cls.datasource_version = m.SourceVersion.objects.create(data_source=cls.datasource, number=1)
        cls.account = m.Account.objects.create(name="account", default_version=cls.datasource_version)
        cls.app_id = "com.app_id.app"
        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id=cls.app_id)
        cls.datasource.projects.set([cls.project])

        # --- 2. Users for Main Account ---
        # Admin
        cls.user_admin = cls.create_user_with_profile(
            username="admin",
            account=cls.account,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # Non admin
        cls.user_non_admin = cls.create_user_with_profile(
            username="non admin",
            account=cls.account,
            permissions=[POLIO_PERFORMANCE_NON_ADMIN_PERMISSION],
        )

        # Read Only (Can View, Cannot Create/Edit)
        cls.user_read_only = cls.create_user_with_profile(
            username="read only",
            account=cls.account,
            permissions=[POLIO_PERFORMANCE_READ_ONLY_PERMISSION],
        )

        # No Permissions (Read-only)
        cls.user_no_perms = cls.create_user_with_profile(username="No perms", account=cls.account, permissions=[])
        # Anonymous user (unauthenticated)
        cls.anon = AnonymousUser()

        # --- 3. Second Account - For access control tests ---
        cls.other_account = m.Account.objects.create(name="Other account", default_version=cls.datasource_version)
        cls.user_other_account = cls.create_user_with_profile(
            username="other account user",
            account=cls.other_account,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # --- 5. Performance Thresholds Data ---

        # Threshold 1: Stock Out / Last 12 Months (Account)
        cls.threshold_stock_12m = PerformanceThresholds.objects.create(
            account=cls.account,
            indicator="stock_out",
            timeline="last_12_months",
            fail_threshold="10",
            success_threshold="5",
        )

        # Threshold 2: Unusable Vials / To Date (Account)
        cls.threshold_vials_todate = PerformanceThresholds.objects.create(
            account=cls.account,
            indicator="unusable_vials",
            timeline="to_date",
            fail_threshold="100",
            success_threshold="AVERAGE",
        )

        # Threshold 3: Stock Out / Last 12 Months (Akatsuki - Different Account)
        cls.threshold_stock_12m_other_account = PerformanceThresholds.objects.create(
            account=cls.other_account,
            indicator="stock_out",
            timeline="last_12_months",
            fail_threshold="50",
            success_threshold="20",
        )
