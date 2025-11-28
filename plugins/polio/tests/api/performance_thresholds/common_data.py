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
        # --- 1. Main Account (Hokage) ---
        cls.datasource_hokage = m.DataSource.objects.create(name="Datasource Hokage")
        cls.datasource_version_hokage = m.SourceVersion.objects.create(data_source=cls.datasource_hokage, number=1)
        cls.account_hokage = m.Account.objects.create(name="Hokage", default_version=cls.datasource_version_hokage)
        cls.app_id = "hokage"
        cls.project_Tsukuyomi = m.Project.objects.create(
            name="Project Tsukuyomi", account=cls.account_hokage, app_id=cls.app_id
        )
        cls.datasource_hokage.projects.set([cls.project_Tsukuyomi])

        # --- 2. Users for Main Account ---
        # Admin (Can CRUD everything)
        cls.user_Hashirama = cls.create_user_with_profile(
            username="Hashirama Senju",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # Admin 2 (Can CRUD)
        cls.user_Tobirama = cls.create_user_with_profile(
            username="Tobirama Senju",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # Read Only (Can View, Cannot Create/Edit)
        cls.user_Neji = cls.create_user_with_profile(
            username="Neji Hyuga",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_READ_ONLY_PERMISSION],
        )

        # Non-Admin (Can Create/Edit, usually)
        cls.user_Kakashi = cls.create_user_with_profile(
            username="Kakashi Hatake",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_NON_ADMIN_PERMISSION],
        )

        # No Permissions (Should see nothing)
        cls.user_Naruto_no_perms = cls.create_user_with_profile(
            username="Naruto UZUMAKI", account=cls.account_hokage, permissions=[]
        )

        # --- 3. Second Account (Akatsuki) - For Isolation Tests ---
        cls.account_akatsuki = m.Account.objects.create(name="Akatsuki", default_version=cls.datasource_version_hokage)
        cls.user_pain = cls.create_user_with_profile(
            username="Pain",
            account=cls.account_akatsuki,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # --- 4. Org Units (Optional, but good to keep if needed later) ---
        org_unit_type_country = m.OrgUnitType.objects.create(name="Country", category="COUNTRY")
        org_unit_type_block = m.OrgUnitType.objects.create(name="Region", category="REGION")

        cls.land_of_fire = m.OrgUnit.objects.create(name="Land of Fire", org_unit_type=org_unit_type_block)
        cls.konoha = m.OrgUnit.objects.create(
            name="Konoha", org_unit_type=org_unit_type_country, parent=cls.land_of_fire
        )

        # --- 5. Performance Thresholds Data ---

        # Threshold 1: Stock Out / Last 12 Months (Hokage)
        cls.threshold_hokage_stock_12m = PerformanceThresholds.objects.create(
            account=cls.account_hokage,
            indicator="stock_out",
            timeline="last_12_months",
            fail_threshold="10",
            success_threshold="5",
        )

        # Threshold 2: Unusable Vials / To Date (Hokage)
        cls.threshold_hokage_vials_todate = PerformanceThresholds.objects.create(
            account=cls.account_hokage,
            indicator="unusable_vials",
            timeline="to_date",
            fail_threshold="100",
            success_threshold="AVERAGE",
        )

        # Threshold 3: Stock Out / Last 12 Months (Akatsuki - Different Account)
        # This is to test that Hokage users CANNOT see or edit Akatsuki data
        cls.threshold_akatsuki_stock = PerformanceThresholds.objects.create(
            account=cls.account_akatsuki,
            indicator="stock_out",
            timeline="last_12_months",
            fail_threshold="50",
            success_threshold="20",
        )
