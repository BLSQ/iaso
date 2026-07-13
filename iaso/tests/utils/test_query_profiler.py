import io
import os
import tempfile
import traceback

from collections import deque
from contextlib import redirect_stdout
from unittest import mock

from django.conf import settings
from django.db import connection
from django.test import override_settings

from iaso import models as m
from iaso.test import TestCase
from iaso.tests.utils.query_profiler import QueryProfiler


# A pk that can't collide with any real row - lets tests run `.exists()`/`.get()` lookups that
# always miss (and therefore always emit exactly the one query we want to count), regardless of
# what fixtures/other tests have left in the DB.
MISSING_PK = 999_999_999


class QueryProfilerTest(TestCase):
    def test_total_queries_counts_every_query_regardless_of_trace_tables(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()
            m.Account.objects.filter(pk=MISSING_PK - 1).exists()

        self.assertEqual(profiler.total_queries(), 3)

    def test_total_queries_is_zero_when_nothing_ran(self):
        with QueryProfiler() as profiler:
            pass

        self.assertEqual(profiler.total_queries(), 0)
        self.assertEqual(profiler.table_counts(), {})

    def test_table_counts_attributes_select_queries_by_table(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Account.objects.filter(pk=MISSING_PK - 1).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()

        counts = profiler.table_counts()
        self.assertEqual(counts["iaso_account"], 2)
        self.assertEqual(counts["iaso_project"], 1)

    def test_table_counts_attributes_insert_and_update_queries(self):
        with QueryProfiler() as profiler:
            account = m.Account.objects.create(name="QueryProfiler test account")
            m.Account.objects.filter(pk=account.pk).update(name="renamed")

        # 1 INSERT INTO "iaso_account" + 1 UPDATE "iaso_account" - the regex matches both keywords.
        self.assertEqual(profiler.table_counts()["iaso_account"], 2)

    def test_assert_less_equal_query_count_passes_within_bounds(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Account.objects.filter(pk=MISSING_PK - 1).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()

        profiler.assertLessEqualQueryCount({"iaso_account": 2, "iaso_project": 1})

    def test_assert_less_equal_query_count_fails_on_unaccounted_table(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()

        # iaso_project was queried but isn't in `expected` or `exclude` - a bare allow-list check
        # would silently miss this; catching it is the whole point of the accounting requirement.
        with self.assertRaises(AssertionError) as cm:
            profiler.assertLessEqualQueryCount({"iaso_account": 1})
        self.assertIn("iaso_project: not in `expected` or `exclude`, got 1", str(cm.exception))

    def test_assert_less_equal_query_count_exclude_skips_accounting(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()

        profiler.assertLessEqualQueryCount({"iaso_account": 1}, exclude=["iaso_project"])

    def test_assert_less_equal_query_count_fails_when_bound_exceeded(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Account.objects.filter(pk=MISSING_PK - 1).exists()

        with self.assertRaises(AssertionError) as cm:
            profiler.assertLessEqualQueryCount({"iaso_account": 1})
        self.assertIn("iaso_account: expected <= 1, got 2", str(cm.exception))

    def test_assert_less_equal_query_count_reports_every_violation_at_once(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Account.objects.filter(pk=MISSING_PK - 1).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()
            m.Project.objects.filter(pk=MISSING_PK - 1).exists()

        with self.assertRaises(AssertionError) as cm:
            profiler.assertLessEqualQueryCount({"iaso_account": 1, "iaso_project": 1})
        message = str(cm.exception)
        self.assertIn("iaso_account: expected <= 1, got 2", message)
        self.assertIn("iaso_project: expected <= 1, got 2", message)

    def test_queries_for_table_returns_only_matching_queries(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            m.Project.objects.filter(pk=MISSING_PK).exists()

        account_queries = profiler.queries_for_table("iaso_account")
        self.assertEqual(len(account_queries), 1)
        self.assertIn("iaso_account", account_queries[0]["sql"])

    def test_queries_for_table_returns_empty_list_for_untouched_table(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()

        self.assertEqual(profiler.queries_for_table("iaso_project"), [])

    # -- call_sites_for_table --------------------------------------------------------------

    def test_call_sites_for_table_groups_and_counts_by_file_line_and_function(self):
        """Directly exercises the Counter-building logic in `call_sites_for_table`, independent
        of how `_wrapper` decides which frame to record (see the tests below for that part)."""
        profiler = QueryProfiler(trace_tables=["iaso_account"])
        frame_a = traceback.FrameSummary("/opt/app/iaso/some_module.py", 42, "do_thing")
        frame_b = traceback.FrameSummary("/opt/app/iaso/other_module.py", 7, "do_other_thing")
        profiler._stacks_by_table["iaso_account"] = [frame_a, frame_a, frame_b, None]

        sites = profiler.call_sites_for_table("iaso_account")

        self.assertEqual(sites[("/opt/app/iaso/some_module.py", 42, "do_thing")], 2)
        self.assertEqual(sites[("/opt/app/iaso/other_module.py", 7, "do_other_thing")], 1)
        # The `None` entry (no attributable frame) is dropped, not counted as its own bucket.
        self.assertEqual(sum(sites.values()), 3)

    def test_call_sites_for_table_skips_test_frames_and_frames_outside_iaso(self):
        """
        `_wrapper` walks the stack looking for the closest frame that's genuine application code
        under `/iaso/` and not itself test code under `/iaso/tests/` - otherwise every call site
        traced from a test would just point back at the test, which isn't useful.
        """
        fake_stack = [
            traceback.FrameSummary(f"{settings.BASE_DIR}/iaso/tests/utils/test_query_profiler.py", 200, "test_method"),
            traceback.FrameSummary(f"{settings.BASE_DIR}/iaso/some_module.py", 55, "call_the_query"),
            traceback.FrameSummary("/usr/local/lib/python3.9/site-packages/django/db/models/query.py", 100, "exists"),
            traceback.FrameSummary("<wrapper's own frame, dropped by the [:-1] slice>", 1, "_wrapper"),
        ]
        with QueryProfiler(trace_tables=["iaso_account"]) as profiler:
            with mock.patch("traceback.extract_stack", return_value=fake_stack):
                m.Account.objects.filter(pk=MISSING_PK).exists()

        sites = profiler.call_sites_for_table("iaso_account")
        self.assertEqual(dict(sites), {(f"{settings.BASE_DIR}/iaso/some_module.py", 55, "call_the_query"): 1})

    def test_call_sites_for_table_empty_when_no_attributable_frame(self):
        """If every candidate frame is either test code or outside `/iaso/`, no call site can be
        attributed - the query is still counted (see `total_queries`/`table_counts`), it's just
        not attributed to any call site."""
        fake_stack = [
            traceback.FrameSummary(f"{settings.BASE_DIR}/iaso/tests/utils/test_query_profiler.py", 200, "test_method"),
            traceback.FrameSummary("/usr/local/lib/python3.9/site-packages/django/db/models/query.py", 100, "exists"),
            traceback.FrameSummary("<wrapper's own frame, dropped by the [:-1] slice>", 1, "_wrapper"),
        ]
        with QueryProfiler(trace_tables=["iaso_account"]) as profiler:
            with mock.patch("traceback.extract_stack", return_value=fake_stack):
                m.Account.objects.filter(pk=MISSING_PK).exists()

        self.assertEqual(len(profiler.call_sites_for_table("iaso_account")), 0)
        # The query still gets counted globally even though it can't be attributed to a call site.
        self.assertEqual(profiler.total_queries(), 1)

    def test_call_sites_for_table_returns_empty_counter_for_untraced_table(self):
        profiler = QueryProfiler(trace_tables=["iaso_account"])
        self.assertEqual(profiler.call_sites_for_table("iaso_project"), {})

    # -- immunity to Django's queries_log truncation ---------------------------------------

    def test_counts_are_not_truncated_by_djangos_queries_log_cap(self):
        """
        `connection.queries_log` (what `CaptureQueriesContext.captured_queries` reads from) is a
        deque capped at `connection.queries_limit`. Our own wrapper counts every query as it
        happens instead, so `total_queries()`/`table_counts()` stay accurate even once that cap
        is exceeded - unlike `self.queries`/`queries_for_table()`, which mirror Django's own
        (truncated) log.
        """
        original_log = connection.queries_log
        connection.queries_log = deque(connection.queries_log, maxlen=3)
        try:
            with QueryProfiler() as profiler:
                for _ in range(5):
                    m.Account.objects.filter(pk=MISSING_PK).exists()
        finally:
            connection.queries_log = original_log

        self.assertEqual(profiler.total_queries(), 5)
        self.assertEqual(profiler.table_counts()["iaso_account"], 5)
        # Django's own capture is truncated to the deque's maxlen.
        self.assertLessEqual(len(profiler.queries), 3)

    # -- _relpath / _github_url -------------------------------------------------------------

    def test_relpath_returns_path_relative_to_base_dir(self):
        profiler = QueryProfiler()
        filename = os.path.join(settings.BASE_DIR, "iaso", "some_module.py")
        self.assertEqual(profiler._relpath(filename), os.path.join("iaso", "some_module.py"))

    def test_relpath_returns_none_outside_base_dir(self):
        profiler = QueryProfiler()
        self.assertIsNone(profiler._relpath("/usr/local/lib/python3.9/site-packages/django/db/models/query.py"))

    def test_github_url_builds_expected_link(self):
        profiler = QueryProfiler(github_repo="BLSQ/iaso", github_ref="develop")
        filename = os.path.join(settings.BASE_DIR, "iaso", "some_module.py")

        url = profiler._github_url(filename, 42)

        self.assertEqual(url, "https://github.com/BLSQ/iaso/blob/develop/iaso/some_module.py#L42")

    def test_github_url_returns_none_without_github_repo(self):
        profiler = QueryProfiler(github_repo=None)
        filename = os.path.join(settings.BASE_DIR, "iaso", "some_module.py")
        self.assertIsNone(profiler._github_url(filename, 42))

    def test_github_url_returns_none_outside_base_dir(self):
        profiler = QueryProfiler(github_repo="BLSQ/iaso")
        self.assertIsNone(profiler._github_url("/usr/local/lib/python3.9/site-packages/django/foo.py", 42))

    # -- _code_snippet ------------------------------------------------------------------------

    def test_code_snippet_returns_context_window_with_marker_on_target_line(self):
        content_lines = [f"line {i}\n" for i in range(1, 21)]  # 20 lines
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.writelines(content_lines)
            path = f.name

        try:
            profiler = QueryProfiler(snippet_context=4)
            snippet = profiler._code_snippet(path, lineno=10)
        finally:
            os.remove(path)

        self.assertIsNotNone(snippet)
        rendered_lines = snippet.splitlines()
        # Window: 0-indexed range(max(0, 10-1-4), min(20, 10+4)) = range(5, 14), i.e. 9 lines
        # (1-indexed lines 6 through 14).
        self.assertEqual(len(rendered_lines), 9)
        # Exactly one line is marked as the target line, and it's line 10.
        marked = [line for line in rendered_lines if line.startswith(">")]
        self.assertEqual(len(marked), 1)
        self.assertIn("line 10", marked[0])
        # Every other line uses the blank marker.
        unmarked = [line for line in rendered_lines if not line.startswith(">")]
        self.assertTrue(all(line.startswith(" ") for line in unmarked))
        self.assertEqual(len(unmarked), 8)

    def test_code_snippet_clamps_window_to_file_bounds(self):
        content_lines = [f"line {i}\n" for i in range(1, 4)]  # only 3 lines
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.writelines(content_lines)
            path = f.name

        try:
            profiler = QueryProfiler(snippet_context=4)
            snippet = profiler._code_snippet(path, lineno=1)
        finally:
            os.remove(path)

        # Requesting 4 lines of context around line 1 in a 3-line file can't go past either edge.
        self.assertEqual(len(snippet.splitlines()), 3)

    def test_code_snippet_returns_none_for_missing_file(self):
        profiler = QueryProfiler()
        self.assertIsNone(profiler._code_snippet("/no/such/file.py", 1))

    # -- _format_sql --------------------------------------------------------------------------

    def test_format_sql_breaks_onto_separate_lines_per_keyword(self):
        profiler = QueryProfiler()
        sql = 'SELECT "iaso_form"."id" FROM "iaso_form" WHERE "iaso_form"."id" = 1 AND "iaso_form"."deleted_at" IS NULL ORDER BY "iaso_form"."id"'

        formatted = profiler._format_sql(sql)

        lines = formatted.splitlines()
        self.assertTrue(any(line.startswith("FROM ") for line in lines))
        self.assertTrue(any(line.startswith("WHERE ") for line in lines))
        self.assertTrue(any(line.startswith("AND ") for line in lines))
        self.assertTrue(any(line.startswith("ORDER BY ") for line in lines))

    def test_format_sql_wraps_long_column_lists_without_exceeding_width(self):
        profiler = QueryProfiler()
        columns = ", ".join(f'"iaso_form"."column_{i}"' for i in range(20))
        sql = f'SELECT {columns} FROM "iaso_form"'

        formatted = profiler._format_sql(sql, line_width=60)

        for line in formatted.splitlines():
            # Wrapping only guarantees no *unforced* overflow: a single token longer than
            # line_width on its own would still exceed it, but none of our columns do here.
            self.assertLessEqual(len(line), 60 + 1)  # +1 for the trailing comma added when wrapping

    def test_format_sql_leaves_short_statement_untouched_besides_keyword_breaks(self):
        profiler = QueryProfiler()
        sql = 'SELECT "id" FROM "iaso_form"'

        formatted = profiler._format_sql(sql, line_width=100)

        self.assertEqual(formatted, 'SELECT "id"\nFROM "iaso_form"')

    # -- print_report -------------------------------------------------------------------------

    def test_print_report_prints_totals_and_call_sites(self):
        with QueryProfiler(trace_tables=["iaso_account"]) as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            profiler.print_report()
        output = buffer.getvalue()

        self.assertIn("Total queries: 1", output)
        self.assertIn("iaso_account: 1", output)

    def test_print_report_omits_call_sites_section_for_table_with_no_hits(self):
        with QueryProfiler(trace_tables=["iaso_account"]) as profiler:
            pass  # no queries at all

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            profiler.print_report()

        self.assertNotIn("Call sites for iaso_account", buffer.getvalue())

    # -- to_markdown --------------------------------------------------------------------------

    def test_to_markdown_includes_title_and_table_breakdown(self):
        with QueryProfiler() as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()

        markdown = profiler.to_markdown(title="My Report")

        self.assertTrue(markdown.startswith("# My Report"))
        self.assertIn("**Total queries:** 1", markdown)
        self.assertIn("| `iaso_account` | 1 |", markdown)

    def test_to_markdown_includes_call_sites_and_queries_sections_for_traced_table(self):
        # A call site can only be attributed to non-test application code (see the
        # call_sites_for_table tests above), so fake a stack with an /iaso/ app frame in it.
        fake_stack = [
            traceback.FrameSummary(f"{settings.BASE_DIR}/iaso/some_module.py", 55, "call_the_query"),
            traceback.FrameSummary("<wrapper's own frame, dropped by the [:-1] slice>", 1, "_wrapper"),
        ]
        with QueryProfiler(trace_tables=["iaso_account"]) as profiler:
            with mock.patch("traceback.extract_stack", return_value=fake_stack):
                m.Account.objects.filter(pk=MISSING_PK).exists()

        markdown = profiler.to_markdown()

        self.assertIn("## `iaso_account`", markdown)
        self.assertIn("**Call sites:**", markdown)
        self.assertIn("**Queries** (identical SQL collapsed, most frequent first):", markdown)
        self.assertIn("```sql", markdown)

    def test_to_markdown_skips_traced_table_with_no_hits(self):
        with QueryProfiler(trace_tables=["iaso_account", "iaso_project"]) as profiler:
            m.Account.objects.filter(pk=MISSING_PK).exists()
            # iaso_project is traced but never touched.

        markdown = profiler.to_markdown()

        self.assertIn("## `iaso_account`", markdown)
        self.assertNotIn("## `iaso_project`", markdown)

    # -- write_markdown_report ----------------------------------------------------------------

    def test_write_markdown_report_writes_file_matching_to_markdown(self):
        with tempfile.TemporaryDirectory() as tmp_media_root:
            with override_settings(MEDIA_ROOT=tmp_media_root):
                with QueryProfiler() as profiler:
                    m.Account.objects.filter(pk=MISSING_PK).exists()

                path = profiler.write_markdown_report("report.md", title="Written report")

                self.assertEqual(path, os.path.join(tmp_media_root, "query_reports", "report.md"))
                with open(path) as f:
                    content = f.read()
                self.assertEqual(content, profiler.to_markdown(title="Written report"))

    def test_write_markdown_report_overwrites_existing_file(self):
        with tempfile.TemporaryDirectory() as tmp_media_root:
            with override_settings(MEDIA_ROOT=tmp_media_root):
                report_dir = os.path.join(tmp_media_root, "query_reports")
                os.makedirs(report_dir)
                existing_path = os.path.join(report_dir, "report.md")
                with open(existing_path, "w") as f:
                    f.write("stale content")

                with QueryProfiler() as profiler:
                    pass
                path = profiler.write_markdown_report("report.md", title="Fresh report")

                with open(path) as f:
                    self.assertEqual(f.read(), profiler.to_markdown(title="Fresh report"))
