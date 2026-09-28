import decimal
import importlib
import json
import random
import threading

from dataclasses import dataclass
from datetime import datetime, timedelta
from logging import getLogger
from typing import Any, List, Optional, Tuple

import boto3
import dateparser

from django.conf import settings
from django.db import connection, connections, transaction
from django.utils import timezone

from beanstalk_worker.throttle import Concurrency, effective_throttle
from iaso.models.base import ERRORED, KILLED, QUEUED, RUNNING
from iaso.models.json_config import Config
from iaso.models.task import Task, TaskLease


logger = getLogger(__name__)

# Slug of the Config overriding the throttle limits declared in the code, see beanstalk_worker/throttle.py
THROTTLE_CONFIG_SLUG = "task_throttles"
HEARTBEAT_INTERVAL = 30  # seconds
# A running task whose heartbeat is older than this is considered lost: its worker was killed
LOST_AFTER = timedelta(minutes=3)
BACKOFF_BASE_DELAY = 15  # seconds
# Start of the progress message of the queued tasks waiting for a throttle slot
THROTTLED_MESSAGE_PREFIX = "Waiting for a free slot"
# Tasks waiting for a global slot retry more often, so they don't get overtaken by the newly queued ones
MAX_GLOBAL_BACKOFF_DELAY = 60
MAX_BACKOFF_DELAY = 300  # SQS accepts up to 900
# A throttled task still waiting this long after its creation is marked ERRORED, unless its task is paused
MAX_THROTTLE_WAIT = timedelta(hours=24)
_MISSING = object()

# Worker connection
# The problem we had before was that, if a task launched a transaction, the progress on the transaction was not visible from the outside:
#  we have background tasks, executed in a worker, for database heavy operation that modify or create a lot of records
#  we execute some of them in a transaction, via transaction.atomic) so we can roll back the changes in case of error (and also speed up stuff a bit)
#  at the same time we have a Task object in DB, on which we record the task progress (status and percentage of completion) during the execution of the task, so we can present it to the users
#  when a task is run in a transaction, the progress cannot be seen from the web, since the transaction is not commited yet
#
# So to resolve this we wanted to open the Task object in a new connection, we didn't find a way in django to open
#  directly a separate connection outside of the transaction. (transaction are tied to a database connexion)
#  so the work around we found was to make a new database configuration in the django system, which is a copy of the original one.


def json_dump(obj):
    if isinstance(obj, datetime):
        return {"__type__": "datetime", "value": obj.isoformat()}
    if isinstance(obj, decimal.Decimal):
        return {"__type__": "decimal", "value": str(obj)}
    assert False, type(obj)


def json_load(obj):
    if "__type__" in obj:
        if obj["__type__"] == "datetime":
            return dateparser.parse(obj["value"])
        if obj["__type__"] == "decimal":
            return decimal.Decimal(obj["value"])
        assert False
    else:
        return obj


class _TaskServiceBase:
    def get_queryset(self):
        # This allows overriding in test. Since all test are run in transactions, the newly created task were not visible
        # from the worker.
        return Task.objects.using("worker")

    # Only the SQS TaskService enforces the `throttle` of the tasks, see beanstalk_worker/throttle.py
    throttling = False

    def run_task(self, body):
        data = json.loads(body, object_hook=json_load)
        self.run(
            data["module"],
            data["method"],
            data["task_id"],
            data["args"],
            data["kwargs"],
            throttle_attempt=data.get("throttle_attempt", 0),
        )

    def run(self, module_name, method_name, task_id, args, kwargs, throttle_attempt=0):
        """run a task, called by the view that receives them from the queue"""
        #  for the using() see Worker connection above
        task = self.get_queryset().get(id=task_id)
        if task.status != QUEUED:  # ensure a task is only run once
            return
        if task.should_be_killed:  # killed before it started, e.g. while waiting for a throttle slot
            self._end_queued(task, KILLED, "Killed before it started")
            return
        module = importlib.import_module(module_name)
        method = getattr(module, method_name)
        assert method._is_task

        blocked = self._start(task, method, kwargs)
        if blocked:
            if not blocked.paused and timezone.now() - task.created_at > MAX_THROTTLE_WAIT:
                self._end_queued(
                    task, ERRORED, f"Gave up waiting for a free slot after {MAX_THROTTLE_WAIT}: {blocked.reason}"
                )
                return
            self._defer(task, module_name, method_name, args, kwargs, throttle_attempt + 1, blocked)
            return
        if task.status != RUNNING:  # another worker started it first
            return

        heartbeat = Heartbeat(self.get_queryset().db, task.id)
        heartbeat.start()
        try:
            method(*args, task=task, _immediate=True, **kwargs)
        finally:
            heartbeat.stop()
            TaskLease.objects.using(self.get_queryset().db).filter(task_id=task.id).delete()

        task.refresh_from_db()
        if task.status == RUNNING:
            logger.warning(f"Task {task} still in status RUNNING after execution")

    def _start(self, task, method, kwargs) -> Optional["Blocked"]:
        """Mark the task RUNNING and give it a lease, unless a throttle limit is reached: then return why.

        Throttle checks are serialized per task name with an advisory lock, so that two workers can't both take the
        last free slot. The conditional update ensures that a task delivered twice by the queue only runs once."""
        qs = self.get_queryset()
        task_name = method._task_name or task.name
        with transaction.atomic(using=qs.db):
            # the slots are recorded on every run, so that runs started before a limit is configured count for it
            slots = throttle_slots(task, task_name, effective_throttle(method._throttle), kwargs)
            # a task is throttled by the limits of its code, or by the config only
            config = _throttle_config(task_name, qs.db) if self.throttling else {}
            if self.throttling and (method._throttle or config):
                with connections[qs.db].cursor() as cursor:
                    cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", [f"task_throttle:{task_name}"])
                reap_lost_tasks(qs.db)
                blocked = check_throttle(task, task_name, slots, config, kwargs, qs.db)
                if blocked:
                    return blocked
            throttle_keys = [key_name for _, _, key_name in slots]

            now = timezone.now()
            if qs.filter(id=task.id, status=QUEUED).update(status=RUNNING, started_at=now):
                TaskLease.objects.using(qs.db).update_or_create(
                    task_id=task.id, defaults={"throttle_keys": throttle_keys, "heartbeat_at": now}
                )
        task.refresh_from_db()
        return None

    def _end_queued(self, task, status, message):
        """End a task that never started. The conditional update leaves it alone if another worker started it."""
        logger.warning(f"Task {task.id} not started: {message}")
        self.get_queryset().filter(id=task.id, status=QUEUED).update(
            status=status, ended_at=timezone.now(), result={"result": status, "message": message}
        )

    def _defer(self, task, module_name, method_name, args, kwargs, attempt, blocked):
        raise NotImplementedError(f"{self.__class__.__name__} does not support throttling")

    def _body(self, module_name, method_name, task_id, args, kwargs, **extra):
        return json.dumps(
            {"module": module_name, "method": method_name, "task_id": task_id, "args": args, "kwargs": kwargs, **extra},
            default=json_dump,
        )

    def enqueue(self, module_name, method_name, args, kwargs, task_id):
        return self._enqueue(self._body(module_name, method_name, task_id, args, kwargs))


class PostgresTaskService(_TaskServiceBase):
    def _enqueue(self, body):
        cursor = connection.cursor()
        cursor.execute("NOTIFY NEW_TASK, ''")
        return {"result": "recorded into DB"}

    def run_task(self, task):
        params = task.params

        if not (params and "module" in params and "method" in params):
            # This is for old task that may be in the DB but are not in the new system
            logger.warning(f"Skipping {task} missing method in params: {params}")
            task.status = KILLED
            task.save()
            return
        self.run(params["module"], params["method"], task.id, params["args"], params["kwargs"])

    def run_all(self):
        """run everything in the queue"""
        # clear on_commit stuff

        if connection.in_atomic_block:
            while connection.run_on_commit:
                sids, func = connection.run_on_commit.pop(0)
                func()
        count = 0
        task = self.get_queryset().filter(status=QUEUED).first()
        while task:
            self.run_task(task)
            logger.info("=" * 20 + " End task exec " + "=" * 20)
            # Fetch next task
            task = self.get_queryset().filter(status=QUEUED).first()
            count += 1
        return count

    def clear(self):
        Task.objects.filter(status=QUEUED).update(status=KILLED)


class TestTaskService(PostgresTaskService):
    def get_queryset(self):
        return Task.objects.using("default")


class TaskService(_TaskServiceBase):
    throttling = True

    def _enqueue(self, body, delay_seconds=0):
        sqs = boto3.client("sqs", region_name=settings.BEANSTALK_SQS_REGION)
        extra = {"DelaySeconds": delay_seconds} if delay_seconds else {}
        return sqs.send_message(QueueUrl=settings.BEANSTALK_SQS_URL, MessageAttributes={}, MessageBody=body, **extra)

    def _defer(self, task, module_name, method_name, args, kwargs, attempt, blocked):
        """Send the task again to the queue, to be retried later with an exponential backoff.

        sqsd then deletes the current message since the view answers 200. If the worker dies in between, the task is
        delivered twice, which is harmless: only one delivery can switch it to RUNNING."""
        delay = backoff_delay(attempt, blocked.max_delay)
        message = f"{THROTTLED_MESSAGE_PREFIX}: {blocked.reason} (attempt {attempt}, next try in {delay}s)"
        logger.info(f"Task {task.id} throttled. {message}")
        self.get_queryset().filter(id=task.id, status=QUEUED).update(progress_message=message)
        body = self._body(module_name, method_name, task.id, args, kwargs, throttle_attempt=attempt)
        self._enqueue(body, delay_seconds=delay)


@dataclass(frozen=True)
class Blocked:
    reason: str
    max_delay: int  # in seconds
    paused: bool = False  # waits for the config to change, so it never gives up


def backoff_delay(attempt: int, max_delay: int) -> int:
    """Exponential backoff with jitter, so throttled tasks don't all retry at the same time."""
    ceiling = min(max_delay, BACKOFF_BASE_DELAY * 2 ** (attempt - 1))
    return int(ceiling / 2 + random.uniform(0, ceiling / 2))


def throttle_key(task_name, concurrency_name, key=None) -> str:
    return f"{task_name}:{concurrency_name}" if key is None else f"{task_name}:{concurrency_name}:{key}"


def throttle_slots(task, task_name, throttle, kwargs) -> List[Tuple[Concurrency, Any, str]]:
    """The (limit, key, throttle key) a run of the task occupies.

    A limit with a key doesn't apply to the tasks for which the key is None (e.g. the `user` of a task without launcher).
    A key callable that fails is logged and its limit ignored: a mistake must not block the tasks."""
    slots = []
    for concurrency in throttle.concurrency:
        try:
            key = concurrency.key(task, **kwargs) if concurrency.key else None
        except Exception:
            logger.exception(f"Ignoring the throttle limit {concurrency.name} of {task_name}")
            continue
        if concurrency.key and key is None:
            continue
        slots.append((concurrency, key, throttle_key(task_name, concurrency.name, key)))
    return slots


def check_throttle(task, task_name, slots, config, kwargs, db) -> Optional[Blocked]:
    """Return why the task can't start now, or None.

    `config` is the entry of the task in the `task_throttles` Config.
    A limit whose configuration or callable fails is logged and ignored: a mistake must not block the tasks."""
    if config.get("paused"):
        return Blocked(f"paused in the {THROTTLE_CONFIG_SLUG} config", MAX_BACKOFF_DELAY, paused=True)

    alive_leases = TaskLease.objects.using(db).filter(heartbeat_at__gte=timezone.now() - LOST_AFTER)
    for concurrency, key, key_name in slots:
        try:
            limit = _limit(task, concurrency, key, config.get(concurrency.name, _MISSING), kwargs)
        except Exception:
            logger.exception(f"Ignoring the throttle limit {concurrency.name} of {task_name}")
            continue
        if limit is not None and alive_leases.filter(throttle_keys__contains=[key_name]).count() >= limit:
            if key is None:
                return Blocked(f"{concurrency.name} limit of {limit} reached", MAX_GLOBAL_BACKOFF_DELAY)
            return Blocked(f"{concurrency.name} limit of {limit} reached for {key}", MAX_BACKOFF_DELAY)
    return None


def _throttle_config(task_name, db) -> dict:
    try:
        content = Config.objects.using(db).filter(slug=THROTTLE_CONFIG_SLUG).values_list("content", flat=True).first()
        config = (content or {}).get(task_name) or {}
        if not isinstance(config, dict):
            raise ValueError(f"Expected an object for {task_name}, got {config!r}")
        return config
    except Exception:
        logger.exception(f"Invalid {THROTTLE_CONFIG_SLUG} config, using the throttle limits of the code")
        return {}


def configured_limit(concurrency, key, configured, log=True):
    """The limit set in the config for this key: a number, None for unlimited, or _MISSING when not (validly) set."""
    if isinstance(configured, dict):
        keys = configured.get("keys", {})
        default = configured.get("default", _MISSING)
        configured = keys.get(str(key), default) if isinstance(keys, dict) and key is not None else default
    if configured is None or (isinstance(configured, int) and not isinstance(configured, bool)):
        return configured
    if configured is not _MISSING and log:
        logger.error(f"Invalid {THROTTLE_CONFIG_SLUG} limit for {concurrency.name}: {configured!r}, using the code's")
    return _MISSING


def _limit(task, concurrency, key, configured, kwargs) -> Optional[int]:
    limit = configured_limit(concurrency, key, configured)
    if limit is not _MISSING:
        return limit
    return concurrency.limit(task, **kwargs) if callable(concurrency.limit) else concurrency.limit


def reap_lost_tasks(db="worker") -> int:
    """Mark as ERRORED the RUNNING tasks whose worker was killed (their heartbeat stopped), and free their lease."""
    cutoff = timezone.now() - LOST_AFTER
    count = 0
    for lease in TaskLease.objects.using(db).filter(heartbeat_at__lt=cutoff):
        count += (
            Task.objects.using(db)
            .filter(id=lease.task_id, status=RUNNING)
            .update(
                status=ERRORED,
                ended_at=timezone.now(),
                result={"result": ERRORED, "message": f"Worker lost: no heartbeat since {lease.heartbeat_at}"},
            )
        )
        lease.delete()
    if count:
        logger.warning(f"Marked {count} task(s) as ERRORED because their worker was lost")
    return count


class Heartbeat(threading.Thread):
    """Refresh the lease of a running task, from its own database connection so that it's visible immediately
    even if the task runs in a transaction."""

    def __init__(self, db, task_id, interval=HEARTBEAT_INTERVAL):
        super().__init__(name=f"task-heartbeat-{task_id}", daemon=True)
        self.db = db
        self.task_id = task_id
        self.interval = interval
        self._stopped = threading.Event()

    def run(self):
        try:
            while not self._stopped.wait(self.interval):
                try:
                    self.beat()
                except Exception:
                    logger.exception(f"Heartbeat of task {self.task_id} failed")
                    # a failed query can leave this thread's connection unusable, and Django only replaces broken
                    # connections between requests: drop it so that the next beat reconnects
                    connections[self.db].close()
        finally:
            connections.close_all()  # the connections of this thread only

    def beat(self):
        TaskLease.objects.using(self.db).filter(task_id=self.task_id).update(heartbeat_at=timezone.now())

    def stop(self):
        self._stopped.set()
