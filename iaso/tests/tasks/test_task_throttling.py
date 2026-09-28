import json

from datetime import timedelta
from unittest import mock

from django.db import OperationalError
from django.test import override_settings
from django.utils import timezone

from beanstalk_worker import task_decorator
from beanstalk_worker.services import (
    LOST_AFTER,
    MAX_BACKOFF_DELAY,
    MAX_GLOBAL_BACKOFF_DELAY,
    MAX_THROTTLE_WAIT,
    THROTTLE_CONFIG_SLUG,
    Heartbeat,
    TaskService,
    TestTaskService,
    backoff_delay,
    reap_lost_tasks,
)
from beanstalk_worker.throttle import Concurrency, Throttle
from iaso import models as m
from iaso.models.json_config import Config
from iaso.test import TestCase


TASK_NAME = "throttled_test_task"
MODULE = "iaso.tests.tasks.test_task_throttling"

leases_seen_during_run = []


def broken_key(task, **kwargs):
    raise ValueError("oops")


@task_decorator(
    task_name=TASK_NAME,
    throttle=Throttle(
        concurrency=[
            Concurrency("global", limit=3),
            Concurrency("account", limit=2, key=lambda task, **kwargs: task.account_id),
            Concurrency("broken", limit=0, key=broken_key),
        ]
    ),
)
def throttled_test_task(value=None, task=None):
    leases_seen_during_run.append(list(m.TaskLease.objects.filter(task=task).values_list("throttle_keys", flat=True)))


@task_decorator(task_name="unthrottled_test_task")
def unthrottled_test_task(value=None, task=None):
    leases_seen_during_run.append(list(m.TaskLease.objects.filter(task=task).values_list("throttle_keys", flat=True)))


class SQSTestTaskService(TaskService):
    def get_queryset(self):
        # see TestTaskService
        return m.Task.objects.using("default")


@override_settings(BEANSTALK_SQS_REGION="eu-central-1", BEANSTALK_SQS_URL="https://sqs.test/queue")
@mock.patch("beanstalk_worker.services.boto3.client")
class TaskThrottlingTestCase(TestCase):
    def setUp(self):
        leases_seen_during_run.clear()
        self.account_a = m.Account.objects.create(name="A")
        self.account_b = m.Account.objects.create(name="B")
        self.service = SQSTestTaskService()

    def queued_task(self, account, name=TASK_NAME, launcher=None):
        return m.Task.objects.create(
            name=name,
            account=account,
            launcher=launcher,
            params={"module": MODULE, "method": name, "args": [], "kwargs": {"value": 1}},
        )

    def running_task(self, account, heartbeat_at=None):
        task = m.Task.objects.create(name=TASK_NAME, account=account, status=m.RUNNING, started_at=timezone.now())
        m.TaskLease.objects.create(
            task=task,
            throttle_keys=[f"{TASK_NAME}:global", f"{TASK_NAME}:account:{account.id}"],
            heartbeat_at=heartbeat_at or timezone.now(),
        )
        return task

    def run_now(self, task, throttle_attempt=0):
        self.service.run(MODULE, task.name, task.id, [], {"value": 1}, throttle_attempt=throttle_attempt)
        task.refresh_from_db()

    def sent_messages(self, boto_client):
        return [c.kwargs for c in boto_client.return_value.send_message.call_args_list]

    def test_runs_under_the_limits_with_a_lease(self, boto_client):
        task = self.queued_task(self.account_a)

        self.run_now(task)

        self.assertEqual(task.status, m.SUCCESS)
        # the key of the broken limit is ignored
        self.assertEqual(
            leases_seen_during_run, [[[f"{TASK_NAME}:global", f"{TASK_NAME}:account:{self.account_a.id}"]]]
        )
        self.assertFalse(m.TaskLease.objects.exists())
        self.assertEqual(self.sent_messages(boto_client), [])

    def test_account_limit_defers_only_that_account(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task_a = self.queued_task(self.account_a)
        task_b = self.queued_task(self.account_b)

        self.run_now(task_a)
        self.run_now(task_b)

        self.assertEqual(task_a.status, m.QUEUED)
        self.assertIn(f"account limit of 2 reached for {self.account_a.id}", task_a.progress_message)
        self.assertEqual(task_b.status, m.SUCCESS)

        [message] = self.sent_messages(boto_client)
        body = json.loads(message["MessageBody"])
        self.assertEqual(body["task_id"], task_a.id)
        self.assertEqual(body["kwargs"], {"value": 1})
        self.assertEqual(body["throttle_attempt"], 1)
        self.assertTrue(1 <= message["DelaySeconds"] <= MAX_BACKOFF_DELAY)

    def test_global_limit(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        self.running_task(self.account_b)
        task = self.queued_task(self.account_b)

        self.run_now(task)

        self.assertEqual(task.status, m.QUEUED)
        self.assertIn("global limit of 3 reached", task.progress_message)
        [message] = self.sent_messages(boto_client)
        self.assertTrue(message["DelaySeconds"] <= MAX_GLOBAL_BACKOFF_DELAY)

    def test_backoff_grows_with_the_attempts(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)

        self.run_now(task, throttle_attempt=4)

        [message] = self.sent_messages(boto_client)
        self.assertEqual(json.loads(message["MessageBody"])["throttle_attempt"], 5)
        self.assertTrue(15 * 2**4 / 2 <= message["DelaySeconds"] <= 15 * 2**4)

    def test_lost_tasks_free_their_slot_and_are_reaped(self, boto_client):
        lost_1 = self.running_task(self.account_a, heartbeat_at=timezone.now() - LOST_AFTER - timedelta(seconds=1))
        lost_2 = self.running_task(self.account_a, heartbeat_at=timezone.now() - LOST_AFTER - timedelta(seconds=1))
        task = self.queued_task(self.account_a)

        self.run_now(task)

        self.assertEqual(task.status, m.SUCCESS)
        for lost in (lost_1, lost_2):
            lost.refresh_from_db()
            self.assertEqual(lost.status, m.ERRORED)
            self.assertIn("Worker lost", lost.result["message"])
        self.assertFalse(m.TaskLease.objects.exists())

    def test_config_overrides_the_limits(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={TASK_NAME: {"account": 3}})
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)

        self.run_now(task)

        self.assertEqual(task.status, m.SUCCESS)

    def test_config_overrides_the_limit_of_one_key(self, boto_client):
        Config.objects.create(
            slug=THROTTLE_CONFIG_SLUG,
            content={TASK_NAME: {"global": None, "account": {"default": 1, "keys": {str(self.account_b.id): 3}}}},
        )
        self.running_task(self.account_a)
        self.running_task(self.account_b)
        self.running_task(self.account_b)
        task_a = self.queued_task(self.account_a)
        task_b = self.queued_task(self.account_b)

        self.run_now(task_a)
        self.run_now(task_b)

        self.assertEqual(task_a.status, m.QUEUED)
        self.assertEqual(task_b.status, m.SUCCESS)

    def test_paused_in_config(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={TASK_NAME: {"paused": True}})
        task = self.queued_task(self.account_a)

        self.run_now(task)

        self.assertEqual(task.status, m.QUEUED)
        self.assertIn("paused", task.progress_message)

    def test_throttled_too_long_gives_up(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)
        m.Task.objects.filter(id=task.id).update(created_at=timezone.now() - MAX_THROTTLE_WAIT - timedelta(minutes=1))

        self.run_now(task, throttle_attempt=300)

        self.assertEqual(task.status, m.ERRORED)
        self.assertIsNotNone(task.ended_at)
        self.assertIn("Gave up waiting for a free slot", task.result["message"])
        self.assertIn(f"account limit of 2 reached for {self.account_a.id}", task.result["message"])
        self.assertEqual(self.sent_messages(boto_client), [])

    def test_paused_never_gives_up(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={TASK_NAME: {"paused": True}})
        task = self.queued_task(self.account_a)
        m.Task.objects.filter(id=task.id).update(created_at=timezone.now() - MAX_THROTTLE_WAIT - timedelta(days=7))

        self.run_now(task, throttle_attempt=3000)

        self.assertEqual(task.status, m.QUEUED)
        self.assertEqual(len(self.sent_messages(boto_client)), 1)

    def test_killed_while_throttled_is_not_started(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)
        self.run_now(task)
        self.assertEqual(task.status, m.QUEUED)

        m.Task.objects.filter(id=task.id).update(should_be_killed=True)
        m.Task.objects.filter(status=m.RUNNING).update(status=m.SUCCESS)
        m.TaskLease.objects.all().delete()
        self.run_now(task, throttle_attempt=1)

        self.assertEqual(task.status, m.KILLED)
        self.assertIsNotNone(task.ended_at)
        self.assertEqual(task.result, {"result": m.KILLED, "message": "Killed before it started"})
        self.assertEqual(leases_seen_during_run, [])
        self.assertEqual(len(self.sent_messages(boto_client)), 1)  # only the first deferral

    def test_invalid_config_falls_back_to_the_code_limits(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={TASK_NAME: {"account": "lots"}})
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)

        self.run_now(task)

        self.assertEqual(task.status, m.QUEUED)

        Config.objects.filter(slug=THROTTLE_CONFIG_SLUG).update(content=["not", "an", "object"])
        self.run_now(task)

        self.assertEqual(task.status, m.QUEUED)
        self.assertEqual(len(self.sent_messages(boto_client)), 2)

    def test_task_already_started_is_not_run_again(self, boto_client):
        task = self.queued_task(self.account_a)
        m.Task.objects.filter(id=task.id).update(status=m.RUNNING)

        self.run_now(task)

        self.assertEqual(task.status, m.RUNNING)
        self.assertEqual(leases_seen_during_run, [])

    def test_run_task_reads_the_attempt_from_the_message(self, boto_client):
        self.running_task(self.account_a)
        self.running_task(self.account_a)
        task = self.queued_task(self.account_a)
        body = self.service._body(MODULE, "throttled_test_task", task.id, [], {"value": 1}, throttle_attempt=2)

        self.service.run_task(body)

        [message] = self.sent_messages(boto_client)
        self.assertEqual(json.loads(message["MessageBody"])["throttle_attempt"], 3)

    def test_task_without_throttle_in_code_is_throttled_by_the_config(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={"unthrottled_test_task": {"account": 1}})
        running = m.Task.objects.create(name="unthrottled_test_task", account=self.account_a, status=m.RUNNING)
        m.TaskLease.objects.create(
            task=running,
            throttle_keys=[f"unthrottled_test_task:account:{self.account_a.id}"],
            heartbeat_at=timezone.now(),
        )
        task_a = self.queued_task(self.account_a, name="unthrottled_test_task")
        task_b = self.queued_task(self.account_b, name="unthrottled_test_task")

        self.run_now(task_a)
        self.run_now(task_b)

        self.assertEqual(task_a.status, m.QUEUED)
        self.assertIn("account limit of 1 reached", task_a.progress_message)
        self.assertEqual(task_b.status, m.SUCCESS)
        self.assertEqual(
            leases_seen_during_run,
            [[["unthrottled_test_task:global", f"unthrottled_test_task:account:{self.account_b.id}"]]],
        )

    def test_task_without_throttle_nor_config_is_not_checked_but_holds_its_slots(self, boto_client):
        # a limit configured later counts the runs started before
        task = self.queued_task(self.account_a, name="unthrottled_test_task")

        self.run_now(task)

        self.assertEqual(task.status, m.SUCCESS)
        self.assertEqual(
            leases_seen_during_run,
            [[["unthrottled_test_task:global", f"unthrottled_test_task:account:{self.account_a.id}"]]],
        )

    def test_user_limit_ignores_tasks_without_launcher(self, boto_client):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={"unthrottled_test_task": {"user": 0}})
        user = self.create_user_with_profile(username="launcher", account=self.account_a)
        without_launcher = self.queued_task(self.account_a, name="unthrottled_test_task")
        with_launcher = self.queued_task(self.account_a, name="unthrottled_test_task", launcher=user)

        self.run_now(without_launcher)
        self.run_now(with_launcher)

        self.assertEqual(without_launcher.status, m.SUCCESS)
        self.assertEqual(with_launcher.status, m.QUEUED)

    def test_postgres_listener_ignores_the_throttle(self, boto_client):
        for _ in range(3):
            self.running_task(self.account_a)
        task = self.queued_task(self.account_a)

        TestTaskService().run_all()

        task.refresh_from_db()
        self.assertEqual(task.status, m.SUCCESS)
        self.assertEqual(
            leases_seen_during_run, [[[f"{TASK_NAME}:global", f"{TASK_NAME}:account:{self.account_a.id}"]]]
        )


class HeartbeatAndReaperTestCase(TestCase):
    databases = {"default", "worker"}  # the reaper endpoint uses the worker connection

    def setUp(self):
        self.account = m.Account.objects.create(name="A")

    def test_beat_refreshes_the_lease(self):
        task = m.Task.objects.create(name=TASK_NAME, account=self.account, status=m.RUNNING)
        old = timezone.now() - timedelta(minutes=10)
        lease = m.TaskLease.objects.create(task=task, heartbeat_at=old)

        Heartbeat("default", task.id).beat()

        lease.refresh_from_db()
        self.assertGreater(lease.heartbeat_at, old)

    def test_heartbeat_reconnects_after_a_failed_beat(self):
        heartbeat = Heartbeat("worker", 1, interval=0)
        beats = []

        def beat():
            beats.append(len(beats))
            if len(beats) == 1:
                raise OperationalError("server closed the connection unexpectedly")
            heartbeat.stop()

        # run() in this thread, with the connections mocked so that the test connections are left alone
        with (
            mock.patch.object(heartbeat, "beat", side_effect=beat),
            mock.patch("beanstalk_worker.services.connections") as connections,
        ):
            heartbeat.run()

        self.assertEqual(beats, [0, 1])
        connections.__getitem__.assert_called_with("worker")
        connections.__getitem__.return_value.close.assert_called_once()

    def test_reaper_leaves_alive_and_finished_tasks(self):
        stale = timezone.now() - LOST_AFTER - timedelta(seconds=1)
        alive = m.Task.objects.create(name=TASK_NAME, account=self.account, status=m.RUNNING)
        m.TaskLease.objects.create(task=alive, heartbeat_at=timezone.now())
        killed = m.Task.objects.create(name=TASK_NAME, account=self.account, status=m.KILLED)
        m.TaskLease.objects.create(task=killed, heartbeat_at=stale)
        # started before leases existed, or reported by an external service: no lease, left alone
        no_lease = m.Task.objects.create(name=TASK_NAME, account=self.account, status=m.RUNNING)

        self.assertEqual(reap_lost_tasks("default"), 0)

        for task, status in ((alive, m.RUNNING), (killed, m.KILLED), (no_lease, m.RUNNING)):
            task.refresh_from_db()
            self.assertEqual(task.status, status)
        self.assertEqual(list(m.TaskLease.objects.values_list("task_id", flat=True)), [alive.id])

    def test_reap_lost_tasks_endpoint(self):
        response = self.client.post("/tasks/reap_lost_tasks/")

        self.assertEqual(response.status_code, 200)

    def test_backoff_delay(self):
        for attempt in range(1, 20):
            ceiling = min(MAX_BACKOFF_DELAY, 15 * 2 ** (attempt - 1))
            self.assertTrue(ceiling // 2 <= backoff_delay(attempt, MAX_BACKOFF_DELAY) <= ceiling)
