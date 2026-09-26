from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from beanstalk_worker.services import THROTTLED_MESSAGE_PREFIX
from beanstalk_worker.throttle import discover_tasks
from iaso import models as m
from iaso.admin.task_monitor import account_rows, activity, format_duration, task_rows, throttle_rows, totals
from iaso.models.json_config import Config
from iaso.test import TestCase


URL = "/admin/iaso/task/monitor/"


class TaskMonitorTestCase(TestCase):
    def setUp(self):
        self.account_a = m.Account.objects.create(name="Account A")
        self.account_b = m.Account.objects.create(name="Account B")

    def task(self, status, account=None, name="dummy_task", **fields):
        return m.Task.objects.create(
            name=name,
            account=account or self.account_a,
            status=status,
            params={"module": "iaso.tasks.dummy_task", "method": "dummy_task", "args": [], "kwargs": {}},
            **fields,
        )

    def running(self, account, keys):
        task = self.task(m.RUNNING, account, started_at=timezone.now())
        m.TaskLease.objects.create(task=task, throttle_keys=keys, heartbeat_at=timezone.now())
        return task

    def test_task_rows(self):
        now = timezone.now()
        self.task(m.QUEUED)
        self.task(m.QUEUED, progress_message=f"{THROTTLED_MESSAGE_PREFIX}: account limit of 2 reached for 1")
        self.running(self.account_a, [])
        self.task(m.RUNNING)  # no lease
        self.task(m.SUCCESS, started_at=now - timedelta(seconds=30), ended_at=now - timedelta(seconds=10))
        self.task(m.SUCCESS, started_at=now - timedelta(seconds=90), ended_at=now - timedelta(seconds=30))
        self.task(m.ERRORED, name="other_task")
        old = self.task(m.ERRORED, name="other_task")
        m.Task.objects.filter(id=old.id).update(created_at=now - timedelta(days=2))

        rows = {row["name"]: row for row in task_rows(now - timedelta(days=1))}

        dummy = rows["dummy_task"]
        self.assertEqual(
            {k: dummy[k] for k in ("queued", "throttled", "running", "no_heartbeat", m.SUCCESS, m.ERRORED)},
            {"queued": 1, "throttled": 1, "running": 2, "no_heartbeat": 1, m.SUCCESS: 2, m.ERRORED: 0},
        )
        self.assertEqual((dummy["avg_duration"], dummy["max_duration"]), ("40s", "1m 00s"))
        self.assertEqual(rows["other_task"][m.ERRORED], 1)
        self.assertEqual(totals(rows.values())[m.ERRORED], 1)

    def test_account_filter_and_rows(self):
        self.task(m.QUEUED, self.account_a)
        self.running(self.account_b, [])
        self.task(m.RUNNING, self.account_b)
        self.task(m.ERRORED, self.account_b, name="other_task")
        since = timezone.now() - timedelta(days=1)

        [dummy] = task_rows(since, account_id=self.account_a.id)
        self.assertEqual((dummy["name"], dummy["queued"], dummy["running"]), ("dummy_task", 1, 0))

        rows = account_rows(since)
        self.assertEqual([row["name"] for row in rows], ["Account B", "Account A"])  # the busiest first
        self.assertEqual(
            {k: rows[0][k] for k in ("running", "no_heartbeat", m.ERRORED)},
            {"running": 2, "no_heartbeat": 1, m.ERRORED: 1},
        )
        self.assertEqual([row["name"] for row in account_rows(since, task_name="other_task")], ["Account B"])

    def test_throttle_rows_of_an_account(self):
        a, b = self.account_a.id, self.account_b.id
        Config.objects.create(slug="task_throttles", content={"dummy_task": {"account": 1}})
        self.running(self.account_b, [f"dummy_task:account:{b}"])

        [dummy] = [
            t for t in throttle_rows(discover_tasks(), Config.objects.get().content, a) if t["name"] == "dummy_task"
        ]

        self.assertEqual([(r["key"], r["running"]) for r in dummy["limits"][0]["rows"]], [(str(a), 0)])

    def test_throttle_rows(self):
        a, b = self.account_a.id, self.account_b.id
        Config.objects.create(
            slug="task_throttles",
            content={"dummy_task": {"account": {"default": 1, "keys": {str(a): 3}}}},
        )
        self.running(self.account_a, ["dummy_task:global", f"dummy_task:account:{a}"])
        self.running(self.account_b, ["dummy_task:global", f"dummy_task:account:{b}"])
        self.task(m.QUEUED, self.account_b)

        [dummy] = [
            t for t in throttle_rows(discover_tasks(), Config.objects.get().content) if t["name"] == "dummy_task"
        ]

        # global and user are unlimited: not shown
        [account] = dummy["limits"]
        self.assertEqual(account["default_limit"], "1")
        self.assertEqual(
            [(r["key"], r["key_label"], r["running"], r["waiting"], r["limit"], r["full"]) for r in account["rows"]],
            # the most running first, then the most waiting
            [(str(b), "Account B", 1, 1, "1", True), (str(a), "Account A", 1, 0, "3", False)],
        )

    def test_activity(self):
        now = timezone.now()
        for status, minutes_ago in ((m.SUCCESS, 2), (m.SUCCESS, 3), (m.ERRORED, 3), (m.KILLED, 30), (m.QUEUED, 0)):
            task = self.task(status)
            m.Task.objects.filter(id=task.id).update(created_at=now - timedelta(minutes=minutes_ago))
        self.task(m.RUNNING)
        self.task(m.QUEUED, progress_message=f"{THROTTLED_MESSAGE_PREFIX}: global limit of 1 reached")
        other = self.task(m.ERRORED, name="other_task")
        m.Task.objects.filter(id=other.id).update(created_at=now - timedelta(minutes=2))
        old = self.task(m.SUCCESS)
        m.Task.objects.filter(id=old.id).update(created_at=now - timedelta(hours=2))

        buckets = activity("1h")

        self.assertEqual(len(buckets), 12)  # 5 minutes each
        self.assertEqual(
            {
                key: sum(b[key] for b in buckets)
                for key in ("success", "running", "waiting", "throttled", "stopped", "errored")
            },
            {"success": 2, "running": 1, "waiting": 2, "throttled": 1, "stopped": 1, "errored": 2},
        )
        self.assertEqual(sum(b["errored"] for b in activity("1h", task_name="dummy_task")), 1)
        self.assertEqual(len(activity("24h")), 24)
        self.assertEqual(len(activity("7d")), 28)

    def test_page(self):
        admin = User.objects.create_superuser("admin", "admin@example.com", "password")
        self.client.force_login(admin)
        self.task(m.QUEUED)

        response = self.client.get(f"{URL}?window=7d&refresh=10&task=dummy_task")

        self.assertContains(response, "dummy_task")
        self.assertContains(response, '<meta http-equiv="refresh" content="10">')
        self.assertEqual(response.context["window"], "7d")
        self.assertEqual(response.context["chart_task"], "dummy_task")
        self.assertContains(response, 'id="activity-data"')
        # tasks without any activity can be charted too
        self.assertIn("import_gpkg_task", response.context["chart_tasks"])
        self.assertContains(response, "By account")
        [row] = response.context["accounts"]
        self.assertEqual(row["url"], f"?window=7d&refresh=10&task=dummy_task&account={self.account_a.id}")

        response = self.client.get(f"{URL}?account={self.account_a.id}")
        self.assertEqual(response.context["account"], self.account_a)
        self.assertContains(response, "Tasks of Account A")
        self.assertNotContains(response, "By account")
        self.assertEqual(self.client.get(f"{URL}?account=999999").context["account"], None)

    def test_by_account_shows_the_busiest_accounts(self):
        admin = User.objects.create_superuser("admin", "admin@example.com", "password")
        self.client.force_login(admin)
        for i in range(22):
            self.task(m.QUEUED, m.Account.objects.create(name=f"Busy {i}"))

        response = self.client.get(URL)

        self.assertEqual((len(response.context["shown_accounts"]), response.context["hidden_accounts"]), (20, 2))
        self.assertContains(response, "Show the 2 other accounts")
        response = self.client.get(f"{URL}?all_accounts=1")
        self.assertEqual((len(response.context["shown_accounts"]), response.context["hidden_accounts"]), (22, 0))

    def test_page_requires_the_task_view_permission(self):
        staff = User.objects.create_user("staff", password="password", is_staff=True)
        self.client.force_login(staff)

        self.assertEqual(self.client.get(URL).status_code, 403)

    def test_format_duration(self):
        self.assertEqual(
            [format_duration(timedelta(seconds=s)) for s in (5, 75, 3725, 90000)],
            ["5s", "1m 15s", "1h 02m", "1d 1h"],
        )
        self.assertEqual(format_duration(None), "")
