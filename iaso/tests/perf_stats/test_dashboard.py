import datetime
import io

from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.utils import timezone

from iaso import models as m
from iaso.perf_stats.dashboard import Dashboard
from iaso.perf_stats.histogram import bucket_index, empty_buckets
from iaso.perf_stats.report import Bins, summarize, summarize_total
from iaso.test import TestCase


DASHBOARD_URL = "/admin/iaso/perfstat/dashboard/"


def make_stat(
    hour, name="GET api/forms/", durations=(10,), outcome="200", variant="", account=None, kind="http", wait_ms=0
):
    buckets = empty_buckets()
    for duration in durations:
        buckets[bucket_index(duration)] += 1
    error = outcome.startswith("5") or outcome in ("ERRORED", "KILLED")
    return m.PerfStat.objects.create(
        hour=hour,
        kind=kind,
        name=name,
        outcome=outcome,
        variant=variant,
        account_id=account.id if account else None,
        count=len(durations),
        errors=len(durations) if error else 0,
        sum_ms=sum(durations),
        max_ms=max(durations),
        sum_wait_ms=wait_ms * len(durations),
        max_wait_ms=wait_ms,
        sum_db_ms=sum(durations) / 2,
        sum_db_queries=3 * len(durations),
        buckets=buckets,
    )


class PerfStatsDashboardTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.hour = timezone.now().replace(minute=0, second=0, microsecond=0)
        cls.account = m.Account.objects.create(name="Big account")
        cls.other_account = m.Account.objects.create(name="Small account")
        make_stat(cls.hour, name="GET api/instances/", durations=[1000, 2000], account=cls.account)
        make_stat(cls.hour, name="GET api/instances/", durations=[5000], variant="xlsx", account=cls.account)
        make_stat(cls.hour - datetime.timedelta(hours=3), durations=[20] * 10, account=cls.account)
        make_stat(cls.hour, durations=[30], outcome="500", account=cls.other_account)
        make_stat(cls.hour, name="POST api/token/", durations=[5])
        make_stat(
            cls.hour,
            kind="task",
            name="iaso.tasks.export.run",
            durations=[60_000],
            outcome="SUCCESS",
            wait_ms=4000,
            account=cls.account,
        )
        make_stat(
            cls.hour,
            kind="task",
            name="iaso.tasks.export.run",
            durations=[1000],
            outcome="ERRORED",
            account=cls.account,
        )
        # Out of every period
        make_stat(cls.hour - datetime.timedelta(days=40), name="GET api/old/", durations=[99_999])

        cls.staff = cls.create_user_with_profile(username="staff", account=cls.account, is_staff=True)
        cls.staff.user_permissions.add(Permission.objects.get(codename="view_perfstat"))
        cls.staff_without_permission = cls.create_user_with_profile(
            username="staff_no_perm", account=cls.account, is_staff=True
        )

    def get(self, params=None):
        self.client.force_login(self.staff)
        response = self.client.get(DASHBOARD_URL, params or {})
        self.assertEqual(response.status_code, 200)
        return response

    def test_requires_view_permission(self):
        self.assertEqual(self.client.get(DASHBOARD_URL).status_code, 302)  # to the admin login
        self.client.force_login(self.staff_without_permission)
        self.assertEqual(self.client.get(DASHBOARD_URL).status_code, 403)

    def test_changelist_links_to_dashboard_and_shows_account_names(self):
        self.client.force_login(self.staff)
        response = self.client.get("/admin/iaso/perfstat/")
        self.assertContains(response, DASHBOARD_URL)
        self.assertContains(response, "Big account")

    def test_accounts_level_sorted_by_total_time(self):
        response = self.get()

        self.assertEqual(response.context["level"], "accounts")
        self.assertEqual(
            [row["label"] for row in response.context["rows"]], ["Big account", "Small account", "(no account)"]
        )
        # Only HTTP requests: tasks have their own tab
        self.assertEqual(response.context["total"]["count"], "15")
        self.assertNotContains(response, "api/old/")

    def test_sort_by_count(self):
        response = self.get({"sort": "count", "view": "names"})

        labels = [(row["label"], row["variant"]) for row in response.context["rows"]]
        self.assertEqual(labels[0], ("GET api/forms/", ""))

    def test_names_level_across_accounts(self):
        response = self.get({"view": "names"})

        self.assertEqual(response.context["level"], "names")
        rows = {(row["label"], row["variant"]): row for row in response.context["rows"]}
        self.assertEqual(
            set(rows),
            {
                ("GET api/instances/", ""),
                ("GET api/instances/", "xlsx"),
                ("GET api/forms/", ""),
                ("POST api/token/", ""),
            },
        )
        # api/forms/ merges both accounts: 10 + 1 requests, 1 of them a 500
        self.assertEqual(rows[("GET api/forms/", "")]["cells"]["count"], "11")
        self.assertEqual(rows[("GET api/forms/", "")]["cells"]["errors"], "9.1%")

    def test_account_level(self):
        response = self.get({"account": self.account.id})

        self.assertEqual(response.context["level"], "names")
        self.assertEqual(
            [(row["label"], row["variant"]) for row in response.context["rows"]],
            [("GET api/instances/", "xlsx"), ("GET api/instances/", ""), ("GET api/forms/", "")],
        )
        self.assertContains(response, "Big account")
        self.assertNotContains(response, "api/token/")

    def test_unattributed_requests_level(self):
        response = self.get({"account": "none"})

        self.assertEqual([row["label"] for row in response.context["rows"]], ["POST api/token/"])

    def test_name_level(self):
        response = self.get({"name": "GET api/instances/"})

        self.assertEqual(response.context["level"], "name")
        self.assertEqual(response.context["total"]["count"], "3")
        breakdowns = {breakdown["title"]: breakdown["rows"] for breakdown in response.context["breakdowns"]}
        self.assertEqual([row["label"] for row in breakdowns["Per variant"]], ["xlsx", "(plain)"])
        self.assertEqual([row["label"] for row in breakdowns["Per status"]], ["200"])
        self.assertEqual([row["label"] for row in breakdowns["Per account"]], ["Big account"])
        self.assertIsNotNone(response.context["histogram"])
        self.assertContains(response, 'class="apm-chart"', count=4)

    def test_name_level_within_account_has_no_account_breakdown(self):
        response = self.get({"name": "GET api/forms/", "account": self.other_account.id})

        titles = [breakdown["title"] for breakdown in response.context["breakdowns"]]
        self.assertEqual(titles, ["Per variant", "Per status"])
        self.assertEqual(response.context["total"]["count"], "1")

    def test_bad_requests_exclude_access_errors(self):
        name = "POST api/mobile/bulk_upload/"
        make_stat(self.hour, name=name, durations=[10] * 6, account=self.other_account)
        make_stat(self.hour, name=name, durations=[10] * 2, outcome="400", account=self.other_account)
        make_stat(self.hour, name=name, durations=[10], outcome="409", account=self.other_account)
        for status in ("401", "403", "404"):
            make_stat(self.hour, name=name, durations=[10], outcome=status, account=self.other_account)

        response = self.get({"view": "names", "sort": "bad_requests"})

        row = response.context["rows"][0]
        self.assertEqual(row["label"], name)
        self.assertEqual(row["cells"]["bad_requests"], "25%")  # 3 of 12
        self.assertEqual(row["cells"]["bad_requests_title"], "400: 2 · 409: 1")
        self.assertContains(response, 'title="400: 2 · 409: 1"')
        self.assertContains(response, "Bad req.")

    def test_tasks_tab(self):
        response = self.get({"kind": "task"})

        self.assertEqual([row["label"] for row in response.context["rows"]], ["Big account"])
        self.assertEqual(response.context["total"]["count"], "2")
        self.assertEqual(response.context["total"]["errors"], "50%")
        self.assertEqual(response.context["total"]["wait"], "2.0 s")
        self.assertContains(response, "Avg wait")
        self.assertNotContains(response, "Bad req.")
        self.assertNotContains(response, "api/instances/")

        response = self.get({"kind": "task", "name": "iaso.tasks.export.run"})
        breakdowns = {breakdown["title"]: breakdown["rows"] for breakdown in response.context["breakdowns"]}
        self.assertEqual([row["label"] for row in breakdowns["Per outcome"]], ["SUCCESS", "ERRORED"])

    def test_periods(self):
        self.assertEqual(len(self.get({"period": "24h"}).context["timeline"]["bars"]), 24)
        self.assertEqual(len(self.get({"period": "7d"}).context["timeline"]["bars"]), 28)
        self.assertEqual(len(self.get({"period": "30d"}).context["timeline"]["bars"]), 30)
        # Invalid values fall back to defaults
        response = self.get({"period": "1y", "sort": "nope", "kind": "nope"})
        self.assertEqual(response.context["period_key"], "7d")
        self.assertEqual(response.context["labels"].tab, "HTTP requests")

    def test_empty(self):
        m.PerfStat.objects.all().delete()
        self.assertContains(self.get(), "No requests recorded")

    def test_links_keep_period_and_kind(self):
        dashboard = Dashboard({"period": "30d", "sort": "p95", "kind": "task"})
        self.assertEqual(dashboard.url(account="12"), "?kind=task&period=30d&sort=p95&account=12")
        self.assertEqual(dashboard.url(sort="count"), "?kind=task&period=30d&sort=count")


class ReportTestCase(TestCase):
    def test_summarize_merges_histograms(self):
        hour = timezone.now().replace(minute=0, second=0, microsecond=0)
        make_stat(hour, durations=[10] * 90)
        make_stat(hour - datetime.timedelta(hours=1), durations=[1000] * 10, outcome="500")

        total = summarize_total(m.PerfStat.objects.all())
        self.assertEqual(total.count, 100)
        self.assertEqual(total.errors, 10)
        self.assertEqual(total.total_ms, 10_900)
        self.assertLess(total.p50, 15)
        self.assertGreater(total.p95, 700)

    def test_bins(self):
        start = datetime.datetime(2026, 9, 1, tzinfo=datetime.timezone.utc)
        bins = Bins(start=start, hours=6, count=4)
        self.assertEqual(bins.index(start), 0)
        self.assertEqual(bins.index(start + datetime.timedelta(hours=7)), 1)
        self.assertEqual(bins.index(start + datetime.timedelta(days=5)), 3)  # clamped
        self.assertEqual(bins.bin_start(2), start + datetime.timedelta(hours=12))

    def test_summarize_timeline(self):
        start = datetime.datetime(2026, 9, 1, tzinfo=datetime.timezone.utc)
        make_stat(start, durations=[10])
        make_stat(start + datetime.timedelta(hours=7), durations=[20, 30])

        [summary] = summarize(
            m.PerfStat.objects.all(), key=lambda stat: stat.name, bins=Bins(start=start, hours=6, count=4)
        )
        self.assertEqual(summary.timeline, [10, 50, 0, 0])

    def test_report_command(self):
        hour = timezone.now().replace(minute=0, second=0, microsecond=0)
        make_stat(hour, durations=[10, 20], variant="csv")
        make_stat(hour, kind="task", name="iaso.tasks.export.run", durations=[60_000], outcome="SUCCESS", wait_ms=500)

        out = io.StringIO()
        call_command("perf_stats_report", "--days", "1", "--by-outcome", stdout=out)
        self.assertIn("GET api/forms/ ?csv", out.getvalue())
        self.assertIn("200", out.getvalue())
        self.assertNotIn("iaso.tasks", out.getvalue())

        out = io.StringIO()
        call_command("perf_stats_report", "--kind", "task", "--order", "wait", stdout=out)
        self.assertIn("iaso.tasks.export.run", out.getvalue())
        self.assertIn("wait", out.getvalue())
