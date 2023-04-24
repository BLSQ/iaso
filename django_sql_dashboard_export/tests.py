from django.test import TestCase
from django_sql_dashboard.models import Dashboard, DashboardQuery


class ExportTestCase(TestCase):
    databases = {"dashboard", "default"}

    def test_download_csv(self):
        dashboard = Dashboard.objects.create(
            slug="my_dashboard", title="My little dashboard for export", view_policy=Dashboard.ViewPolicies.UNLISTED
        )
        query = DashboardQuery.objects.create(sql="select 1 as a, 'hello' as b", dashboard=dashboard)

        r = self.client.get(f"/explore/my_dashboard/export/?index={query._order}&format=csv")
        self.assertEqual(r.status_code, 200)
        content = r.getvalue()
        self.assertEqual(content, b"a,b\r\n1,hello\r\n")
        self.assertEqual(r.headers["Content-Type"], "text/csv")
        self.assertEqual(r.headers["Content-Disposition"], 'attachment; filename="my_dashboard_0.csv"')

        self.assertEqual(content.decode("ascii"), "a,b\r\n1,hello\r\n")

    def test_download_csv_with_query_param(self):
        dashboard = Dashboard.objects.create(
            slug="my_dashboard",
            title="My little dashboard for export with q param",
            view_policy=Dashboard.ViewPolicies.UNLISTED,
        )
        query = DashboardQuery.objects.create(sql="select 1 as a, %(BValue)s as b", dashboard=dashboard)

        r = self.client.get(f"/explore/my_dashboard/export/?index={query._order}&format=csv&BValue=hello")
        self.assertEqual(r.status_code, 200)
        content = r.getvalue()
        self.assertEqual(content, b"a,b\r\n1,hello\r\n")
        self.assertEqual(r.headers["Content-Type"], "text/csv")
        self.assertEqual(r.headers["Content-Disposition"], 'attachment; filename="my_dashboard_0.csv"')

        self.assertEqual(content.decode("ascii"), "a,b\r\n1,hello\r\n")

    def test_download_tsv(self):
        dashboard = Dashboard.objects.create(
            slug="my_dashboard", title="My little dashboard for export", view_policy=Dashboard.ViewPolicies.UNLISTED
        )
        query = DashboardQuery.objects.create(sql="select 1 as a, 'hello' as b", dashboard=dashboard)

        r = self.client.get(f"/explore/my_dashboard/export/?index={query._order}&format=tsv")
        self.assertEqual(r.status_code, 200)
        content = r.getvalue()
        self.assertEqual(r.headers["Content-Type"], "text/tab-separated-values")
        self.assertEqual(r.headers["Content-Disposition"], 'attachment; filename="my_dashboard_0.tsv"')
        self.assertEqual(content.decode("ascii"), """a\tb\r\n1\thello\r\n""")

        self.assertEqual(content, b"a\tb\r\n1\thello\r\n")

    def test_download_no_perm(self):
        dashboard = Dashboard.objects.create(
            slug="my_dashboard", title="My little dashboard for export", view_policy=Dashboard.ViewPolicies.PRIVATE
        )
        query = DashboardQuery.objects.create(sql="select 1 as a, 'hello' as b", dashboard=dashboard)

        r = self.client.get(f"/explore/my_dashboard/export/?index={query._order}&format=csv")
        self.assertEqual(r.status_code, 403)
        content = r.getvalue()
        self.assertEqual(content, b"You cannot access this dashboard")
