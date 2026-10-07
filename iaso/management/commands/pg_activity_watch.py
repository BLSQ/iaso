"""
Poor man's `top` for Postgres.

Repeatedly polls pg_stat_activity for the current database and renders a
live-refreshing snapshot of what's actually running: which backends are
active, how long they've been running, and what (if anything) is blocking
them via pg_blocking_pids().

Meant to be run in a second terminal while something long-running (a big
migration, delete_accounts, a slow endpoint, ...) executes in the first —
purely read-only, doesn't touch or need to know about whatever else is
running.

Usage:
  docker compose exec iaso manage pg_activity_watch
  docker compose exec iaso manage pg_activity_watch --all --min-duration 5
  docker compose exec iaso manage pg_activity_watch --once

Note: pg_stat_activity.query is only visible for other roles' backends if
the connecting role is a superuser or has pg_monitor/pg_read_all_stats;
otherwise Postgres reports "<insufficient privilege>" for those rows.

Ctrl-C to stop.
"""

import datetime
import shutil
import time

from django.core.management.base import BaseCommand
from django.db import connection


_CLEAR_SCREEN = "\033[2J\033[H"

_QUERY_TEMPLATE = """
SELECT * FROM (
    SELECT
        pid,
        usename,
        application_name,
        state,
        wait_event_type,
        wait_event,
        COALESCE(query_start, xact_start, backend_start) AS since,
        EXTRACT(EPOCH FROM (clock_timestamp() - COALESCE(query_start, xact_start, backend_start)))::int AS seconds,
        pg_blocking_pids(pid) AS blocked_by,
        query
    FROM pg_stat_activity
    WHERE pid != pg_backend_pid()
      AND datname = current_database()
) activity
WHERE seconds >= %(min_duration)s
{state_filter}
ORDER BY seconds DESC NULLS LAST
LIMIT %(limit)s
"""


class Command(BaseCommand):
    help = "Poor man's `top` for Postgres: repeatedly polls pg_stat_activity and shows what's actually running."

    def add_arguments(self, parser):
        parser.add_argument("--interval", type=float, default=2.0, help="Refresh interval, in seconds.")
        parser.add_argument(
            "--all",
            action="store_true",
            help="Also show idle connections (default: active / idle-in-transaction only).",
        )
        parser.add_argument(
            "--min-duration", type=float, default=0, help="Only show entries running at least this many seconds."
        )
        parser.add_argument("--limit", type=int, default=50, help="Max rows shown per refresh.")
        parser.add_argument("--once", action="store_true", help="Print a single snapshot and exit instead of looping.")

    def handle(self, *args, **options):
        interval = options["interval"]
        show_all = options["all"]
        min_duration = options["min_duration"]
        limit = options["limit"]
        once = options["once"]

        state_filter = "" if show_all else "AND state != 'idle'"
        sql = _QUERY_TEMPLATE.format(state_filter=state_filter)

        try:
            while True:
                rows = self._fetch(sql, min_duration, limit)
                self._render(rows, show_all, min_duration)
                if once:
                    return
                time.sleep(interval)
        except KeyboardInterrupt:
            return

    def _fetch(self, sql, min_duration, limit):
        with connection.cursor() as cursor:
            cursor.execute(sql, {"min_duration": min_duration, "limit": limit})
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def _render(self, rows, show_all, min_duration):
        width = shutil.get_terminal_size((120, 40)).columns

        if self._stdout_is_a_terminal():
            self.stdout.write(_CLEAR_SCREEN)
        header = f"pg_activity_watch — {len(rows)} row(s)" + ("  (active + idle)" if show_all else "  (active only)")
        if min_duration:
            header += f"  min_duration={min_duration:g}s"
        self.stdout.write(header)
        self.stdout.write("-" * width)
        self.stdout.write(f"{'PID':>7}  {'STATE':16}  {'SINCE':17}  {'SECS':>6}  {'BLOCKED BY':12}  {'WAIT':16}  QUERY")
        self.stdout.write("-" * width)

        for row in rows:
            blocked_by = row["blocked_by"] or []
            blocked_str = ",".join(str(pid) for pid in blocked_by)
            marker = "⛔" if blocked_str else ("▶" if row["state"] == "active" else " ")
            query = (row["query"] or "").replace("\n", " ").strip()
            self.stdout.write(
                f"{row['pid']:>7}  {(row['state'] or ''):16}  {self._format_since(row['since']):17}  "
                f"{row['seconds']:>6}  {blocked_str:12}  {(row['wait_event'] or ''):16}  {marker} {query}"
            )
        self.stdout.write("")

    def _format_since(self, since):
        """The wall-clock time the query/transaction/backend actually started —
        full timestamp (with date) once it's no longer today."""
        if since is None:
            return ""
        now = datetime.datetime.now(since.tzinfo) if since.tzinfo else datetime.datetime.now()
        if since.date() == now.date():
            return since.strftime("%H:%M:%S")
        return since.strftime("%m-%d %H:%M:%S")

    def _stdout_is_a_terminal(self):
        # Clearing the screen only makes sense for an actual terminal — skip it when
        # stdout is captured (tests, `--once` piped to a file, etc.) so output stays readable.
        return getattr(self.stdout, "isatty", lambda: False)()
