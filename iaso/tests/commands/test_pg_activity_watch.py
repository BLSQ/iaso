from io import StringIO

from django.core import management
from django.test import TestCase


class PgActivityWatchCommandTestCase(TestCase):
    """pg_activity_watch is read-only (polls pg_stat_activity) — these just check it runs
    and renders a snapshot without error, not any particular row content."""

    def test_once_prints_a_snapshot_header(self):
        out = StringIO()
        management.call_command("pg_activity_watch", once=True, stdout=out)

        self.assertIn("pg_activity_watch —", out.getvalue())
        self.assertIn("PID", out.getvalue())

    def test_all_and_min_duration_options_are_accepted(self):
        out = StringIO()
        management.call_command("pg_activity_watch", once=True, all=True, min_duration=0, stdout=out)

        self.assertIn("(active + idle)", out.getvalue())

    def test_limit_option_is_accepted(self):
        out = StringIO()
        management.call_command("pg_activity_watch", once=True, limit=1, stdout=out)

        self.assertIn("pg_activity_watch —", out.getvalue())
