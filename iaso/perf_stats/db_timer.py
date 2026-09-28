import time

from contextlib import ExitStack, contextmanager

from django.conf import settings
from django.db import connections


class DbTimer:
    """Count and time the SQL queries run on the current thread's connections, whatever `DEBUG` is."""

    def __init__(self):
        self.queries = 0
        self.duration_ms = 0.0

    def __call__(self, execute, sql, params, many, context):
        start = time.perf_counter()
        try:
            return execute(sql, params, many, context)
        finally:
            self.queries += 1
            self.duration_ms += (time.perf_counter() - start) * 1000

    @contextmanager
    def measure(self):
        # Every alias (`worker`, `task_logs`... point to the main database too), except a separate perf stats database,
        # only written by the flush thread.
        separate_database = settings.PERF_STATS_DATABASE if settings.PERF_STATS_DATABASE != "default" else None
        with ExitStack() as stack:
            for alias in connections:
                if alias != separate_database:
                    stack.enter_context(connections[alias].execute_wrapper(self))
            yield self
