"""In-process buffer of performance stats, periodically flushed to ``PerfStat``.

Recording an operation (HTTP request, background task) only touches memory. Attribution (user -> account,
app_id -> project/account) is resolved at flush time with one query per kind, so the request path never hits the
database.

Each process (gunicorn worker, task worker) owns a buffer and a daemon thread flushing it every
``settings.PERF_STATS_FLUSH_INTERVAL`` seconds. Rows are merged into the table with an upsert that adds counters
and histograms, so concurrent processes can flush the same hour/name safely. Stats buffered in a process that is
killed abruptly are lost, which is acceptable for monitoring.
"""

import atexit
import datetime
import logging
import os
import threading
import time

from dataclasses import dataclass, field
from typing import NamedTuple, Optional

from django.conf import settings
from django.db import connection, connections, transaction
from django.utils import timezone

from iaso.models import PerfStat, Profile, Project
from iaso.perf_stats.histogram import bucket_index, empty_buckets, merge_buckets


logger = logging.getLogger(__name__)

# Protects the worker memory if flushing fails repeatedly: new keys are dropped once the buffer is this big.
MAX_BUFFERED_KEYS = 20_000
UPSERT_BATCH_SIZE = 500
PRUNE_EVERY_SECONDS = 24 * 3600


class BufferKey(NamedTuple):
    hour: datetime.datetime
    kind: str
    name: str
    variant: str
    outcome: str
    account_id: Optional[int]
    user_id: Optional[int]
    app_id: Optional[str]


class RowKey(NamedTuple):
    hour: datetime.datetime
    kind: str
    name: str
    variant: str
    outcome: str
    account_id: Optional[int]
    project_id: Optional[int]


@dataclass
class Aggregate:
    count: int = 0
    errors: int = 0
    sum_ms: float = 0.0
    max_ms: float = 0.0
    sum_wait_ms: float = 0.0
    max_wait_ms: float = 0.0
    sum_db_ms: float = 0.0
    sum_db_queries: int = 0
    buckets: list[int] = field(default_factory=empty_buckets)

    def add_operation(self, duration_ms: float, error: bool, wait_ms: float, db_ms: float, db_queries: int) -> None:
        self.count += 1
        self.errors += int(error)
        self.sum_ms += duration_ms
        self.max_ms = max(self.max_ms, duration_ms)
        self.sum_wait_ms += wait_ms
        self.max_wait_ms = max(self.max_wait_ms, wait_ms)
        self.sum_db_ms += db_ms
        self.sum_db_queries += db_queries
        self.buckets[bucket_index(duration_ms)] += 1

    def merge(self, other: "Aggregate") -> None:
        self.count += other.count
        self.errors += other.errors
        self.sum_ms += other.sum_ms
        self.max_ms = max(self.max_ms, other.max_ms)
        self.sum_wait_ms += other.sum_wait_ms
        self.max_wait_ms = max(self.max_wait_ms, other.max_wait_ms)
        self.sum_db_ms += other.sum_db_ms
        self.sum_db_queries += other.sum_db_queries
        merge_buckets(self.buckets, other.buckets)


class Collector:
    def __init__(self, flush_interval: Optional[float] = None, retention_days: Optional[int] = None):
        self.flush_interval = flush_interval
        self.retention_days = retention_days
        self._buffer: dict[BufferKey, Aggregate] = {}
        self._lock = threading.Lock()
        self._flush_lock = threading.Lock()
        self._thread_pid: Optional[int] = None
        self._last_prune = 0.0
        self.dropped = 0

    def record(
        self,
        *,
        kind: str,
        name: str,
        outcome: str,
        duration_ms: float,
        error: bool = False,
        variant: str = "",
        wait_ms: float = 0.0,
        db_ms: float = 0.0,
        db_queries: int = 0,
        account_id: Optional[int] = None,
        user_id: Optional[int] = None,
        app_id: Optional[str] = None,
        now: Optional[datetime.datetime] = None,
    ) -> None:
        """Buffer one operation.

        The account is `account_id` when given, otherwise the account of the project of `app_id`, otherwise the
        account of `user_id`.
        """
        hour = (now or timezone.now()).replace(minute=0, second=0, microsecond=0)
        key = BufferKey(hour, kind, name, variant, outcome, account_id, user_id, app_id)
        with self._lock:
            aggregate = self._buffer.get(key)
            if aggregate is None:
                if len(self._buffer) >= MAX_BUFFERED_KEYS:
                    self.dropped += 1
                    return
                aggregate = self._buffer[key] = Aggregate()
            aggregate.add_operation(duration_ms, error, wait_ms, db_ms, db_queries)
        self._ensure_flush_thread()

    def flush(self) -> None:
        """Write the buffered stats to the database. Safe to call from any thread."""
        with self._flush_lock:
            with self._lock:
                buffer, self._buffer = self._buffer, {}
            if not buffer:
                return
            try:
                rows = self._resolve(buffer)
                self._upsert(rows)
            except Exception:
                logger.exception("Could not flush %d perf stats entries, dropping them", len(buffer))

    def prune(self) -> int:
        cutoff = timezone.now() - datetime.timedelta(days=self.retention_days)
        deleted, _ = PerfStat.objects.filter(hour__lt=cutoff).delete()
        return deleted

    @staticmethod
    def _resolve(buffer: dict[BufferKey, Aggregate]) -> dict[RowKey, Aggregate]:
        app_ids = {key.app_id for key in buffer if key.app_id}
        user_ids = {key.user_id for key in buffer if key.user_id and not key.account_id}
        projects = {}
        if app_ids:
            projects = {
                app_id: (project_id, account_id)
                for app_id, project_id, account_id in Project.objects.filter(app_id__in=app_ids).values_list(
                    "app_id", "id", "account_id"
                )
            }
        user_accounts = {}
        if user_ids:
            user_accounts = dict(Profile.objects.filter(user_id__in=user_ids).values_list("user_id", "account_id"))

        rows: dict[RowKey, Aggregate] = {}
        for key, aggregate in buffer.items():
            project_id, project_account_id = projects.get(key.app_id, (None, None))
            account_id = key.account_id or project_account_id or user_accounts.get(key.user_id)
            row_key = RowKey(key.hour, key.kind, key.name, key.variant, key.outcome, account_id, project_id)
            if row_key in rows:
                rows[row_key].merge(aggregate)
            else:
                rows[row_key] = aggregate
        return rows

    @staticmethod
    def _upsert(rows: dict[RowKey, Aggregate]) -> None:
        table = PerfStat._meta.db_table
        database = settings.PERF_STATS_DATABASE
        # Sorted so that concurrent flushes lock rows in the same order and can't deadlock.
        items = sorted(rows.items(), key=lambda item: tuple("" if v is None else str(v) for v in item[0]))
        with transaction.atomic(using=database), connections[database].cursor() as cursor:
            for start in range(0, len(items), UPSERT_BATCH_SIZE):
                batch = items[start : start + UPSERT_BATCH_SIZE]
                values_sql = ", ".join(["(" + "%s, " * 15 + "%s::integer[])"] * len(batch))
                params = []
                for key, agg in batch:
                    params.extend(
                        [
                            key.hour,
                            key.kind,
                            key.name,
                            key.variant,
                            key.outcome,
                            key.account_id,
                            key.project_id,
                            agg.count,
                            agg.errors,
                            agg.sum_ms,
                            agg.max_ms,
                            agg.sum_wait_ms,
                            agg.max_wait_ms,
                            agg.sum_db_ms,
                            agg.sum_db_queries,
                            agg.buckets,
                        ]
                    )
                cursor.execute(
                    f"""
                    INSERT INTO {table} AS s
                        (hour, kind, name, variant, outcome, account_id, project_id, count, errors,
                         sum_ms, max_ms, sum_wait_ms, max_wait_ms, sum_db_ms, sum_db_queries, buckets)
                    VALUES {values_sql}
                    ON CONFLICT (
                        hour, kind, name, variant, outcome, (COALESCE(account_id, 0)), (COALESCE(project_id, 0))
                    )
                    DO UPDATE SET
                        count = s.count + EXCLUDED.count,
                        errors = s.errors + EXCLUDED.errors,
                        sum_ms = s.sum_ms + EXCLUDED.sum_ms,
                        max_ms = GREATEST(s.max_ms, EXCLUDED.max_ms),
                        sum_wait_ms = s.sum_wait_ms + EXCLUDED.sum_wait_ms,
                        max_wait_ms = GREATEST(s.max_wait_ms, EXCLUDED.max_wait_ms),
                        sum_db_ms = s.sum_db_ms + EXCLUDED.sum_db_ms,
                        sum_db_queries = s.sum_db_queries + EXCLUDED.sum_db_queries,
                        buckets = (
                            SELECT array_agg(COALESCE(a, 0) + COALESCE(b, 0) ORDER BY i)
                            FROM unnest(s.buckets, EXCLUDED.buckets) WITH ORDINALITY AS u(a, b, i)
                        )
                    """,
                    params,
                )

    def _ensure_flush_thread(self) -> None:
        # Started lazily, and again after a fork, since threads don't survive it.
        if not self.flush_interval or self._thread_pid == os.getpid():
            return
        with self._lock:
            if self._thread_pid == os.getpid():
                return
            self._thread_pid = os.getpid()
        threading.Thread(target=self._run, name="perf-stats-flush", daemon=True).start()

    def _run(self) -> None:
        while True:
            time.sleep(self.flush_interval)
            try:
                self.flush()
                if self.retention_days and time.monotonic() - self._last_prune > PRUNE_EVERY_SECONDS:
                    self._last_prune = time.monotonic()
                    try:
                        self.prune()
                    except Exception:
                        logger.exception("Could not prune old perf stats")
            finally:
                # This thread's connections would otherwise sit idle between flushes, one extra per worker process.
                connection.close()
                connections[settings.PERF_STATS_DATABASE].close()


collector = Collector(
    flush_interval=getattr(settings, "PERF_STATS_FLUSH_INTERVAL", 30),
    retention_days=getattr(settings, "PERF_STATS_RETENTION_DAYS", 90),
)
atexit.register(collector.flush)
