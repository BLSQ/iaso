"""Data of the admin page monitoring the background tasks: counts per status and task, and the use of the throttle
limits (see beanstalk_worker/throttle.py)."""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Dict, List, Optional, Tuple

from django.contrib.auth.models import User
from django.db.models import Avg, Count, F, Func, IntegerField, Max, Min, Q
from django.utils import timezone

from beanstalk_worker.services import (
    _MISSING,
    LOST_AFTER,
    THROTTLED_MESSAGE_PREFIX,
    configured_limit,
    throttle_key,
    throttle_slots,
)
from beanstalk_worker.throttle import Throttle, effective_throttle
from iaso.models import ERRORED, EXPORTED, KILLED, QUEUED, RUNNING, SKIPPED, SUCCESS, Account, Task, TaskLease


WINDOWS = {"1h": timedelta(hours=1), "24h": timedelta(days=1), "7d": timedelta(days=7)}
# size of the bars of the activity chart, per window
BUCKETS = {"1h": timedelta(minutes=5), "24h": timedelta(hours=1), "7d": timedelta(hours=6)}
# series of the activity chart, bottom to top: errored and success are kept apart for the color blind readers
ACTIVITY_SERIES = ("success", "running", "waiting", "stopped", "errored")
ACTIVITY_SERIES_OF_STATUS = {
    SUCCESS: "success",
    EXPORTED: "success",
    RUNNING: "running",
    QUEUED: "waiting",
    KILLED: "stopped",
    SKIPPED: "stopped",
    ERRORED: "errored",
}
DEFAULT_WINDOW = "24h"
FINISHED_STATUSES = [SUCCESS, ERRORED, KILLED, SKIPPED]
MAX_QUEUED_TASKS = 5000  # queued tasks inspected to find their throttle keys
MAX_KEYS_PER_LIMIT = 20
MAX_ACCOUNTS = 20  # shown in the "By account" table, unless asked for all


def format_duration(duration: Optional[timedelta]) -> str:
    if duration is None:
        return ""
    seconds = int(duration.total_seconds())
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m {seconds % 60:02d}s"
    if seconds < 86400:
        return f"{seconds // 3600}h {seconds % 3600 // 60:02d}m"
    return f"{seconds // 86400}d {seconds % 86400 // 3600}h"


class EpochBucket(Func):
    """Number of the time bucket of a datetime: floor(epoch / bucket seconds)"""

    template = "floor(extract(epoch from %(expressions)s) / %(seconds)s)"
    output_field = IntegerField()


def activity(window: str, task_name: str = "", account_id=None) -> List[dict]:
    """Tasks created per time bucket of the window, by current status; `throttled` is part of `waiting`."""
    size = int(BUCKETS[window].total_seconds())
    now = timezone.now()
    first = int((now - WINDOWS[window]).timestamp()) // size + 1
    last = int(now.timestamp()) // size
    tasks = Task.objects.filter(**_filters(account_id, task_name)).filter(
        created_at__gte=datetime.fromtimestamp(first * size, tz=dt_timezone.utc)
    )
    counts = (
        tasks.order_by()
        .annotate(bucket=EpochBucket("created_at", seconds=size))
        .values_list("bucket", "status")
        .annotate(n=Count("id"), throttled=Count("id", filter=Q(progress_message__startswith=THROTTLED_MESSAGE_PREFIX)))
    )
    buckets = {number: dict.fromkeys((*ACTIVITY_SERIES, "throttled"), 0) for number in range(first, last + 1)}
    for number, status, n, throttled in counts:
        if number in buckets:
            buckets[number][ACTIVITY_SERIES_OF_STATUS.get(status, "stopped")] += n
            if status == QUEUED:
                buckets[number]["throttled"] += throttled
    return [
        {"start": datetime.fromtimestamp(number * size, tz=dt_timezone.utc).isoformat(), **values}
        for number, values in sorted(buckets.items())
    ]


def alive_leases():
    return TaskLease.objects.filter(heartbeat_at__gte=timezone.now() - LOST_AFTER)


def _status_counts(since, field, filters) -> Tuple[Dict, Dict]:
    """Per value of `field` of the tasks matching `filters`: the queued and running tasks now, and the tasks created
    since `since` per final status. Also returns when the oldest queued task was created."""
    tasks = Task.objects.filter(**filters)
    counts = defaultdict(Counter)
    oldest_queued = {}

    queued = (
        tasks.filter(status=QUEUED)
        .order_by()
        .values(field)
        .annotate(
            n=Count("id"),
            throttled=Count("id", filter=Q(progress_message__startswith=THROTTLED_MESSAGE_PREFIX)),
            oldest=Min("created_at"),
        )
    )
    for row in queued:
        counts[row[field]].update(queued=row["n"] - row["throttled"], throttled=row["throttled"])
        oldest_queued[row[field]] = row["oldest"]

    for value, n in tasks.filter(status=RUNNING).order_by().values_list(field).annotate(n=Count("id")):
        counts[value]["running"] = n
    alive = alive_leases().filter(task__status=RUNNING, **{f"task__{k}": v for k, v in filters.items()})
    for value, n in alive.order_by().values_list(f"task__{field}").annotate(n=Count("id")):
        counts[value]["alive"] = n

    finished = (
        tasks.filter(created_at__gte=since, status__in=FINISHED_STATUSES)
        .order_by()
        .values_list(field, "status")
        .annotate(n=Count("id"))
    )
    for value, status, n in finished:
        counts[value][status] = n
    return counts, oldest_queued


def _row(counts, oldest_queued, now) -> dict:
    return {
        "queued": counts["queued"],
        "throttled": counts["throttled"],
        "running": counts["running"],
        # running without a heartbeat: external, started before the leases existed, or stuck
        "no_heartbeat": counts["running"] - counts["alive"],
        "waiting_since": format_duration(now - oldest_queued if oldest_queued else None),
        **{status: counts[status] for status in FINISHED_STATUSES},
    }


def _filters(account_id=None, task_name="") -> dict:
    filters = {}
    if account_id:
        filters["account_id"] = account_id
    if task_name:
        filters["name"] = task_name
    return filters


def task_rows(since, account_id=None) -> List[dict]:
    """Per task name: the queued and running tasks now, and the tasks created since `since` per final status."""
    tasks = Task.objects.filter(**_filters(account_id))
    counts, oldest_queued = _status_counts(since, "name", _filters(account_id))
    successes = (
        tasks.filter(created_at__gte=since, status=SUCCESS, started_at__isnull=False, ended_at__isnull=False)
        .order_by()
        .values("name")
        .annotate(avg=Avg(F("ended_at") - F("started_at")), max=Max(F("ended_at") - F("started_at")))
    )
    durations = {row["name"]: (row["avg"], row["max"]) for row in successes}

    now = timezone.now()
    result = []
    for name in sorted(counts):
        avg, longest = durations.get(name, (None, None))
        result.append(
            {
                "name": name,
                **_row(counts[name], oldest_queued.get(name), now),
                "avg_duration": format_duration(avg),
                "max_duration": format_duration(longest),
            }
        )
    return result


def account_rows(since, task_name="") -> List[dict]:
    """The same counts as task_rows, per account: the busiest first."""
    counts, oldest_queued = _status_counts(since, "account_id", _filters(task_name=task_name))
    names = dict(Account.objects.filter(id__in=list(counts)).values_list("id", "name"))
    now = timezone.now()
    result = [
        {
            "id": account_id,
            "name": names.get(account_id, account_id),
            **_row(counts[account_id], oldest_queued.get(account_id), now),
        }
        for account_id in counts
    ]
    result.sort(key=lambda r: (-(r["running"] + r["queued"] + r["throttled"]), -sum(r[s] for s in FINISHED_STATUSES)))
    return result


def totals(rows) -> Dict[str, int]:
    fields = ["queued", "throttled", "running", "no_heartbeat", *FINISHED_STATUSES]
    return {field: sum(row[field] for row in rows) for field in fields}


def limit_label(concurrency, key, configured) -> str:
    limit = configured_limit(concurrency, key, configured, log=False)
    if limit is _MISSING:
        if callable(concurrency.limit):
            return "computed"
        limit = concurrency.limit
    return "unlimited" if limit is None else str(limit)


def _is_limited(concurrency, configured) -> bool:
    """If the limit is set for at least one key"""
    if isinstance(configured, dict):
        values = [configured.get("default", _MISSING), *(configured.get("keys") or {}).values()]
    else:
        values = [configured]
    values = [v for v in values if v is not _MISSING]
    return any(v is not None for v in values) or (not values and concurrency.limit is not None)


def _key_labels(concurrency_name, keys) -> Dict[str, str]:
    """Names of the accounts and users, for the built-in keys"""
    ids = [int(key) for key in keys if str(key).isdigit()]
    if concurrency_name == "account":
        return {str(pk): name for pk, name in Account.objects.filter(id__in=ids).values_list("id", "name")}
    if concurrency_name == "user":
        return {str(pk): name for pk, name in User.objects.filter(id__in=ids).values_list("id", "username")}
    return {}


def throttle_rows(tasks: Dict[str, Optional[Throttle]], content, account_id=None) -> List[dict]:
    """Per throttled task and limit: how many runs are running and waiting, per key.

    With `account_id`, the `account` limits only show that account (the other limits are shared by all the accounts)."""
    content = content if isinstance(content, dict) else {}
    names = sorted(name for name in tasks if tasks[name] is not None or isinstance(content.get(name), dict))

    running = Counter()
    for keys in alive_leases().filter(task__status=RUNNING).values_list("throttle_keys", flat=True):
        running.update(keys)
    waiting = Counter()
    for task in Task.objects.filter(status=QUEUED, name__in=names).order_by("created_at")[:MAX_QUEUED_TASKS]:
        kwargs = (task.params or {}).get("kwargs") or {}
        waiting.update(
            key_name for _, _, key_name in throttle_slots(task, task.name, _throttle(tasks, task.name), kwargs)
        )

    result = []
    for name in names:
        entry = content.get(name) if isinstance(content.get(name), dict) else {}
        limits = []
        for concurrency in _throttle(tasks, name).concurrency:
            configured = entry.get(concurrency.name, _MISSING)
            if not _is_limited(concurrency, configured):
                continue
            prefix = throttle_key(name, concurrency.name)
            if concurrency.key is None:
                keys = [None]
            else:
                overrides = configured.get("keys", {}) if isinstance(configured, dict) else {}
                used = {k[len(prefix) + 1 :] for k in (*running, *waiting) if k.startswith(f"{prefix}:")}
                keys = sorted(
                    used | set(overrides),
                    key=lambda k: (
                        -running[throttle_key(name, concurrency.name, k)],
                        -waiting[throttle_key(name, concurrency.name, k)],
                        str(k),
                    ),
                )
                if account_id and concurrency.name == "account":
                    keys = [str(account_id)]
            labels = _key_labels(concurrency.name, [k for k in keys if k is not None])
            rows = []
            for key in keys[:MAX_KEYS_PER_LIMIT]:
                key_name = throttle_key(name, concurrency.name, key)
                label = limit_label(concurrency, key, configured)
                rows.append(
                    {
                        "key": key,
                        "key_label": labels.get(str(key), ""),
                        "running": running[key_name],
                        "waiting": waiting[key_name],
                        "limit": label,
                        "full": label.isdigit() and running[key_name] >= int(label),
                    }
                )
            limits.append(
                {
                    "name": concurrency.name,
                    "keyed": concurrency.key is not None,
                    "default_limit": limit_label(concurrency, None, configured),
                    "rows": rows,
                    "hidden_keys": max(0, len(keys) - MAX_KEYS_PER_LIMIT),
                }
            )
        result.append({"name": name, "paused": entry.get("paused") is True, "limits": limits})
    return result


def _throttle(tasks, name) -> Throttle:
    return effective_throttle(tasks.get(name))
