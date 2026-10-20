import datetime

from unittest import mock

from django.test import override_settings

from beanstalk_worker.services import TestTaskService
from iaso import models as m
from iaso.models.base import ERRORED, RUNNING, SUCCESS
from iaso.perf_stats.collector import Collector
from iaso.perf_stats.router import PerfStatsRouter
from iaso.perf_stats.tasks import measure_task
from iaso.tasks.dummy_task import dummy_task
from iaso.test import TestCase


@override_settings(PERF_STATS_ENABLED=True)
class MeasureTaskTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")

    def setUp(self):
        self.collector = Collector()
        patcher = mock.patch("iaso.perf_stats.tasks.collector", self.collector)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.task = m.Task.objects.create(account=self.account, name="export", status=RUNNING)
        self.task.started_at = self.task.created_at + datetime.timedelta(seconds=3)

    def test_records_outcome_wait_account_and_db_usage(self):
        with measure_task(self.task, "iaso.tasks.export.run"):
            list(m.Account.objects.all())
            self.task.status = SUCCESS
        self.collector.flush()

        stat = m.PerfStat.objects.get()
        self.assertEqual((stat.kind, stat.name, stat.outcome), ("task", "iaso.tasks.export.run", SUCCESS))
        self.assertEqual(stat.account_id, self.account.id)
        self.assertEqual((stat.count, stat.errors), (1, 0))
        self.assertEqual(stat.sum_wait_ms, 3000)
        self.assertGreaterEqual(stat.sum_db_queries, 1)

    def test_failed_task_is_an_error(self):
        with measure_task(self.task, "iaso.tasks.export.run"):
            self.task.status = ERRORED
        self.collector.flush()

        self.assertEqual(m.PerfStat.objects.get().errors, 1)

    def test_exception_is_recorded_and_propagated(self):
        with self.assertRaises(ValueError):
            with measure_task(self.task, "iaso.tasks.export.run"):
                raise ValueError
        self.collector.flush()

        self.assertEqual(m.PerfStat.objects.get().outcome, ERRORED)

    @override_settings(PERF_STATS_ENABLED=False)
    def test_disabled(self):
        with measure_task(self.task, "iaso.tasks.export.run"):
            pass
        self.collector.flush()

        self.assertFalse(m.PerfStat.objects.exists())


@override_settings(PERF_STATS_ENABLED=True)
@mock.patch("iaso.tasks.dummy_task.time.sleep")
class WorkerMeasuresTaskTestCase(TestCase):
    def setUp(self):
        self.collector = Collector()
        patcher = mock.patch("iaso.perf_stats.tasks.collector", self.collector)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.account = m.Account.objects.create(name="Belgium")
        self.user = self.create_user_with_profile(username="user", account=self.account)

    def test_task_run_by_the_worker_is_recorded_with_its_final_status(self, sleep):
        dummy_task(duration=1, user=self.user)
        dummy_task(duration=1, fail=True, user=self.user)

        TestTaskService().run_all()
        self.collector.flush()

        stats = m.PerfStat.objects.filter(kind="task").order_by("outcome")
        self.assertEqual(
            [(stat.name, stat.outcome, stat.count, stat.account_id) for stat in stats],
            [
                ("iaso.tasks.dummy_task.dummy_task", ERRORED, 1, self.account.id),
                ("iaso.tasks.dummy_task.dummy_task", SUCCESS, 1, self.account.id),
            ],
        )


class PerfStatsRouterTestCase(TestCase):
    router = PerfStatsRouter()

    def test_default_database(self):
        self.assertEqual(self.router.db_for_write(m.PerfStat), "default")
        self.assertIsNone(self.router.db_for_write(m.Account))
        self.assertIsNone(self.router.allow_migrate("default", "iaso", "perfstat"))

    @override_settings(PERF_STATS_DATABASE="perf_stats")
    def test_separate_database(self):
        self.assertEqual(self.router.db_for_read(m.PerfStat), "perf_stats")
        self.assertIsNone(self.router.db_for_read(m.Account))
        self.assertTrue(self.router.allow_migrate("perf_stats", "iaso", "perfstat"))
        self.assertFalse(self.router.allow_migrate("perf_stats", "iaso", "account"))
        self.assertFalse(self.router.allow_migrate("perf_stats", "iaso", None))  # RunSQL / RunPython of other models
        self.assertFalse(self.router.allow_migrate("default", "iaso", "perfstat"))
        self.assertIsNone(self.router.allow_migrate("default", "iaso", "account"))
