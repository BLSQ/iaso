import logging
import time

from contextlib import contextmanager

from django.conf import settings

from iaso.models import PerfStat
from iaso.models.base import ERRORED, KILLED
from iaso.perf_stats.collector import collector
from iaso.perf_stats.db_timer import DbTimer


logger = logging.getLogger(__name__)


@contextmanager
def measure_task(task, name: str):
    """Record the duration, final status, queue wait and DB usage of a background task run inside this block.

    The block must leave `task.status` up to date (the task decorator catches the task exceptions to set it).
    """
    if not settings.PERF_STATS_ENABLED:
        yield
        return

    db_timer = DbTimer()
    start = time.perf_counter()
    raised = True
    try:
        with db_timer.measure():
            yield
        raised = False
    finally:
        try:
            outcome = ERRORED if raised else task.status
            wait_ms = 0.0
            if task.started_at and task.created_at:
                wait_ms = max((task.started_at - task.created_at).total_seconds() * 1000, 0.0)
            collector.record(
                kind=PerfStat.Kind.TASK,
                name=name[:255],
                outcome=outcome,
                error=outcome in (ERRORED, KILLED),
                duration_ms=(time.perf_counter() - start) * 1000,
                wait_ms=wait_ms,
                db_ms=db_timer.duration_ms,
                db_queries=db_timer.queries,
                account_id=task.account_id,
            )
        except Exception:
            logger.exception("Could not record perf stats of task %s", task.id)
