import datetime

from django.utils import timezone

from iaso import models as m
from iaso.perf_stats.collector import Collector
from iaso.perf_stats.histogram import bucket_index
from iaso.test import TestCase


NOW = datetime.datetime(2026, 9, 28, 10, 42, 12, tzinfo=datetime.timezone.utc)
HOUR = NOW.replace(minute=0, second=0)


class CollectorTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.project = m.Project.objects.create(name="Project", app_id="org.test.app", account=cls.other_account)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def setUp(self):
        # No flush_interval: no background thread, tests flush explicitly.
        self.collector = Collector(retention_days=30)

    def record(self, **kwargs):
        defaults = {
            "kind": m.PerfStat.Kind.HTTP,
            "name": "GET api/forms/<pk>/",
            "outcome": "200",
            "duration_ms": 20,
            "now": NOW,
        }
        self.collector.record(**{**defaults, **kwargs})

    def test_flush_aggregates_per_key(self):
        self.record(duration_ms=10, db_ms=4, db_queries=2)
        self.record(duration_ms=30, db_ms=6, db_queries=3)
        self.record(outcome="500", error=True)
        self.collector.flush()

        ok = m.PerfStat.objects.get(outcome="200")
        self.assertEqual(ok.hour, HOUR)
        self.assertEqual((ok.kind, ok.name, ok.account_id, ok.project_id), ("http", "GET api/forms/<pk>/", None, None))
        self.assertEqual(ok.count, 2)
        self.assertEqual(ok.errors, 0)
        self.assertEqual(ok.sum_ms, 40)
        self.assertEqual(ok.max_ms, 30)
        self.assertEqual(ok.sum_db_ms, 10)
        self.assertEqual(ok.sum_db_queries, 5)
        self.assertEqual(sum(ok.buckets), 2)
        self.assertEqual(ok.buckets[bucket_index(10)], 1)
        self.assertEqual(ok.buckets[bucket_index(30)], 1)
        failed = m.PerfStat.objects.get(outcome="500")
        self.assertEqual((failed.count, failed.errors), (1, 1))

    def test_successive_flushes_are_merged_into_existing_rows(self):
        self.record(duration_ms=10, wait_ms=100, user_id=self.user.id)
        self.collector.flush()
        self.record(duration_ms=5000, wait_ms=300, error=True, user_id=self.user.id)
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertEqual(stat.account_id, self.account.id)
        self.assertEqual(stat.count, 2)
        self.assertEqual(stat.errors, 1)
        self.assertEqual(stat.max_ms, 5000)
        self.assertEqual((stat.sum_wait_ms, stat.max_wait_ms), (400, 300))
        self.assertEqual(stat.buckets[bucket_index(10)], 1)
        self.assertEqual(stat.buckets[bucket_index(5000)], 1)
        self.assertEqual(sum(stat.buckets), 2)

    def test_null_account_and_project_rows_are_merged(self):
        self.record()
        self.collector.flush()
        self.record()
        self.collector.flush()

        self.assertEqual(m.PerfStat.objects.get().count, 2)

    def test_app_id_project_account_takes_precedence_over_user_account(self):
        self.record(user_id=self.user.id, app_id="org.test.app")
        self.record(app_id="org.test.app")
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertEqual(stat.project_id, self.project.id)
        self.assertEqual(stat.account_id, self.other_account.id)
        self.assertEqual(stat.count, 2)

    def test_explicit_account_takes_precedence(self):
        self.record(kind=m.PerfStat.Kind.TASK, name="iaso.tasks.x.run", outcome="SUCCESS", account_id=self.account.id)
        self.record(
            kind=m.PerfStat.Kind.TASK,
            name="iaso.tasks.x.run",
            outcome="SUCCESS",
            account_id=self.account.id,
            user_id=self.user.id,
            app_id="org.test.app",
        )
        self.collector.flush()

        stats = list(m.PerfStat.objects.values_list("account_id", "project_id", "count"))
        # The project is still resolved from app_id, the explicit account is kept
        self.assertCountEqual(stats, [(self.account.id, None, 1), (self.account.id, self.project.id, 1)])

    def test_unknown_app_id_falls_back_to_user_account(self):
        self.record(user_id=self.user.id, app_id="unknown")
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertIsNone(stat.project_id)
        self.assertEqual(stat.account_id, self.account.id)

    def test_kinds_variants_and_outcomes_are_separate_rows(self):
        self.record()
        self.record(variant="xlsx")
        self.record(variant="xlsx")
        self.record(kind=m.PerfStat.Kind.TASK)
        self.collector.flush()

        self.assertCountEqual(
            m.PerfStat.objects.values_list("kind", "variant", "count"),
            [("http", "", 1), ("http", "xlsx", 2), ("task", "", 1)],
        )

    def test_requests_are_bucketed_per_hour(self):
        self.record()
        self.record(now=NOW + datetime.timedelta(hours=1))
        self.collector.flush()

        self.assertEqual(
            list(m.PerfStat.objects.order_by("hour").values_list("hour", flat=True)),
            [HOUR, HOUR + datetime.timedelta(hours=1)],
        )

    def test_long_durations_fit_in_the_histogram(self):
        self.record(duration_ms=2 * 3600 * 1000)
        self.collector.flush()

        self.assertEqual(sum(m.PerfStat.objects.get().buckets), 1)

    def test_prune_deletes_old_rows(self):
        self.record(now=timezone.now() - datetime.timedelta(days=31))
        self.record(now=timezone.now())
        self.collector.flush()

        self.assertEqual(self.collector.prune(), 1)
        self.assertEqual(m.PerfStat.objects.count(), 1)
