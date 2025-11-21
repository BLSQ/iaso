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
    """"
        Creating the test data for the performance dashboard API
    """
    PERFORMANCE_DASHBOARD_API_URL= "/api/polio/performance_dashboard/"

    @classmethod
    def setUpTestData(cls):
        #Main Account
        cls.datasource_hokage = m.DataSource.objects.create(name="Datasource Hokage")
        cls.datasource_version_hokage = m.SourceVersion.objects.create(data_source=cls.datasource_hokage, number=1)
        cls.account_hokage = m.Account.objects.create(name="Hokage", default_version=cls.datasource_version_hokage)
        cls.app_id = "hokage"
        cls.project_Tsukuyomi = m.Project.objects.create(
            name="Project Tsukuyomi", account=cls.account_hokage, app_id=cls.app_id
        )
        cls.datasource_hokage.projects.set([cls.project_Tsukuyomi])

        #Users for the main account
        cls.user_Hashirama= cls.create_user_with_profile(
            username="Hashirama Senju",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        cls.user_Tobirama = cls.create_user_with_profile(
            username="Tobirama Senju",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        cls.user_Neji = cls.create_user_with_profile(
            username="Neji Hyuga",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_READ_ONLY_PERMISSION],
        )

        cls.user_Kakashi = cls.create_user_with_profile(
            username="Kakashi Hatake",
            account=cls.account_hokage,
            permissions=[POLIO_PERFORMANCE_NON_ADMIN_PERMISSION],
        )

        #User with no permissions
        cls.user_Naruto_no_perms= cls.create_user_with_profile(
            username="Naruto UZUMAKI",
            account=cls.account_hokage,
            permissions=[]
        )

        # A second account for data isolation tests
        cls.account_akatsuki = m.Account.objects.create(name="Akatsuki", default_version=cls.datasource_version_hokage)
        cls.user_pain = cls.create_user_with_profile(
            username = "Pain",
            account = cls.account_akatsuki,
            permissions = [POLIO_PERFORMANCE_ADMIN_PERMISSION],
        )

        # Org Units
        org_unit_type_country = m.OrgUnitType.objects.create(name="Country", category="COUNTRY")
        org_unit_type_block = m.OrgUnitType.objects.create(name="Region", category="REGION")

        cls.land_of_fire = m.OrgUnit.objects.create(name="Land of Fire", org_unit_type=org_unit_type_block)
        cls.konoha = m.OrgUnit.objects.create(name="Konoha", org_unit_type=org_unit_type_country, parent=cls.land_of_fire)
        cls.land_of_wind = m.OrgUnit.objects.create(name="Land of Wind", org_unit_type=org_unit_type_block)
        cls.suna = m.OrgUnit.objects.create(name="Suna", org_unit_type=org_unit_type_country, parent=cls.land_of_wind)

        cls.dashboard_1 = p.PerformanceDashboard.objects.create(
            account = cls.account_hokage,
            country = cls.land_of_fire,
            date = datetime.date(2025, 10, 10),
            status = "draft",
            antigen = "bOPV",
            created_by = cls.user_Hashirama
        )

        cls.dashboard_2 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.konoha,
            date=datetime.date(2025, 10, 10),
            status="commented",
            antigen="bOPV",
            created_by=cls.user_Kakashi
        )
        cls.dashboard_3 = p.PerformanceDashboard.objects.create(
            account=cls.account_akatsuki,
            country=cls.land_of_wind,
            date=datetime.date(2025, 10, 10),
            status="commented",
            antigen="bOPV",
            created_by=cls.user_pain
        )

        cls.dashboard_4 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.land_of_fire,
            date=datetime.date(2025, 10, 10),
            status="final",
            antigen="nOPV2",
            created_by=cls.user_Neji
        )

        cls.dashboard_5 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.land_of_fire,
            date=datetime.date(2025, 10, 10),
            status="final",
            antigen="nOPV2",
            created_by=cls.user_Tobirama
        )

        cls.dashboard_6 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.land_of_fire,
            date=datetime.date(2025, 10, 10),
            status="final",
            antigen="nOPV2",
            created_by=cls.user_Naruto_no_perms
        )
        cls.dashboard_7 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.konoha,
            date=datetime.date(2025, 10, 10),
            status="commented",
            antigen="nOPV2",
            created_by=cls.user_Kakashi
        )
        cls.dashboard_8 = p.PerformanceDashboard.objects.create(
            account=cls.account_hokage,
            country=cls.suna,
            date=datetime.date(2025, 10, 10),
            status="draft",
            antigen="nOPV2",
            created_by=cls.user_Tobirama
        )
