import os
import re
import time
import traceback
import typing

from collections import Counter
from contextlib import ExitStack, contextmanager
from unittest import mock

from django.conf import settings
from django.core.files.storage import storages
from django.db import connection
from django.test.utils import CaptureQueriesContext


class QueryProfiler:
    """
    Wraps `CaptureQueriesContext` to break down the queries executed in a block of code
    by table, and (optionally) trace the call site (file:line) of every query hitting a
    chosen set of tables. Useful to spot N+1s and duplicated queries when investigating
    a performance issue.

    Usage:
        with QueryProfiler(trace_tables=["iaso_formversion", "iaso_form"]) as profiler:
            do_something()
        with profiler.report_on_failure("my_report.md"):
            profiler.assertLessEqualQueryCount({...})

        # or drill into one table:
        profiler.queries_for_table("iaso_formversion")
        profiler.call_sites_for_table("iaso_formversion")

    It also times the block: the queries (per table) and the calls to the default file storage (per method, with
    their call sites), the rest being Python. The tests use a local db and an in-memory storage, so the time report
    also estimates what the block would take on a deployed server, where each query is a round trip to RDS and each
    storage call one to S3: `db_latency_ms`/`storage_latency_ms` per query/call, defaulting to the
    `QUERY_PROFILER_DB_LATENCY_MS`/`QUERY_PROFILER_STORAGE_LATENCY_MS` env vars, else to 1 ms/20 ms.

    `to_markdown()` links each call site to GitHub (`github_repo`/`github_ref`) and includes a
    collapsed code snippet read straight from the checked-out file - the container has no `.git`
    mounted, so there's no way to auto-detect the repo/branch; override the defaults below if
    reporting on a different repo or branch.
    """

    def __init__(
        self,
        trace_tables: typing.Sequence[str] = (),
        github_repo: typing.Optional[str] = "BLSQ/iaso",
        github_ref: str = "develop",
        snippet_context: int = 4,
        db_latency_ms: typing.Optional[float] = None,
        storage_latency_ms: typing.Optional[float] = None,
    ):
        self.trace_tables = trace_tables
        self.github_repo = github_repo
        self.github_ref = github_ref
        self.snippet_context = snippet_context
        self._stacks_by_table = {t: [] for t in trace_tables}
        # Django's own connection.queries_log (what CaptureQueriesContext reads from) is a deque
        # capped at connection.queries_limit (9000) - silently truncated past that, which makes
        # `self.queries`/counts derived from it wrong for large batches (thousands of instances).
        # Count total/per-table live in our own wrapper instead, which sees every query regardless.
        self._total_queries = 0
        self._table_counts: Counter = Counter()
        self._capture = None
        self._wrapper_ctx = None
        self.queries: typing.Optional[list] = None
        self.db_latency = _latency_seconds(db_latency_ms, "QUERY_PROFILER_DB_LATENCY_MS", default_ms=1)
        self.storage_latency = _latency_seconds(storage_latency_ms, "QUERY_PROFILER_STORAGE_LATENCY_MS", default_ms=20)
        # Queries and seconds spent in them, per first table of their SQL (so that a join isn't counted twice), "?" for
        # the queries without a table (e.g. savepoints)
        self._first_table_counts: Counter = Counter()
        self._table_seconds: Counter = Counter()
        self._storage_counts: Counter = Counter()
        self._storage_seconds: Counter = Counter()
        self._storage_stacks: typing.Dict[str, list] = {}
        self._storage_names: typing.Dict[str, list] = {}
        self._storage_patches = None
        self._started_at = None
        self.elapsed: typing.Optional[float] = None

    def _wrapper(self, execute, sql, params, many, context):
        self._total_queries += 1
        tables = re.findall(r'(?:FROM|UPDATE|INTO)\s+"?(\w+)"?', sql, re.IGNORECASE)
        self._table_counts.update(tables)
        for table in self.trace_tables:
            if f'"{table}"' in sql:
                # Skip our own frames and test-code frames to land on the actual call site.
                frames = [f for f in traceback.extract_stack()[:-1] if _is_project_frame(f.filename, ("iaso",))]
                self._stacks_by_table[table].append(frames[-1] if frames else None)
        start = time.perf_counter()
        try:
            return execute(sql, params, many, context)
        finally:
            first_table = tables[0] if tables else "?"
            self._first_table_counts[first_table] += 1
            self._table_seconds[first_table] += time.perf_counter() - start

    def _timed_storage_method(self, storage_class, method_name):
        original = getattr(storage_class, method_name)
        profiler = self

        def wrapper(storage, *args, **kwargs):
            # The direct caller (e.g. Django's `Storage.save()`), then the project frames calling the storage,
            # innermost first: a few of them, as the innermost one is often a generic helper (e.g. a model field).
            stack = traceback.extract_stack()[:-1]
            frames = [f for f in stack if _is_project_frame(f.filename, ("iaso", "hat", "plugins"))]
            caller = [] if not stack or stack[-1] in frames else [stack[-1]]
            chain = tuple((f.filename, f.lineno, f.name) for f in caller + list(reversed(frames[-3:])))
            profiler._storage_stacks.setdefault(method_name, []).append(chain)
            # Every storage method takes the file name (the S3 key) - or the directory, for `listdir()` - first
            profiler._storage_names.setdefault(method_name, []).append(args[0] if args else kwargs.get("name"))
            start = time.perf_counter()
            try:
                return original(storage, *args, **kwargs)
            finally:
                profiler._storage_counts[method_name] += 1
                profiler._storage_seconds[method_name] += time.perf_counter() - start

        return wrapper

    def __enter__(self):
        self._capture = CaptureQueriesContext(connection)
        self._capture.__enter__()
        self._wrapper_ctx = connection.execute_wrapper(self._wrapper)
        self._wrapper_ctx.__enter__()
        # Patched on the class, as the model file fields hold the storage instance itself. Each method is one round
        # trip on S3 (`_save` an upload, `_open` a download, `exists`/`size` a HEAD...).
        storage_class = type(storages["default"])
        self._storage_patches = ExitStack()
        for method_name in STORAGE_METHODS:
            if hasattr(storage_class, method_name):
                self._storage_patches.enter_context(
                    mock.patch.object(
                        storage_class, method_name, self._timed_storage_method(storage_class, method_name)
                    )
                )
        self._started_at = time.perf_counter()
        return self

    def __exit__(self, *exc_info):
        self.elapsed = time.perf_counter() - self._started_at
        self._storage_patches.close()
        self._wrapper_ctx.__exit__(*exc_info)
        self._capture.__exit__(*exc_info)
        self.queries = self._capture.captured_queries
        return False

    def total_queries(self, exclude: typing.Sequence[str] = ()) -> int:
        """
        `exclude` subtracts the queries hitting those tables - same meaning as in
        `assertLessEqualQueryCount`, so both assertions ignore the same run-order-dependent noise.
        """
        return self._total_queries - sum(self._table_counts[table] for table in exclude)

    def table_counts(self) -> Counter:
        return self._table_counts

    def queries_for_table(self, table: str) -> list:
        """
        Full captured-query dicts (SQL text + timing) for one table - sample data for the
        markdown report's "show me example queries" section. Subject to Django's 9000-query
        cap (see `__init__`), so on very large batches this may miss some occurrences; use
        `table_counts()`/`call_sites_for_table()` for accurate counts regardless of scale.
        """
        return [q for q in self.queries if f'"{table}"' in q["sql"]]

    def call_sites_for_table(self, table: str) -> Counter:
        return Counter((f.filename, f.lineno, f.name) for f in self._stacks_by_table.get(table, []) if f)

    def storage_counts(self) -> Counter:
        """Number of calls per method of the default file storage."""
        return self._storage_counts

    def storage_call_sites(self, method_name: str) -> Counter:
        """The chains of (filename, lineno, name) frames calling a storage method, innermost first: its direct caller
        when outside the project (e.g. Django's `Storage.save()`), then up to 3 project frames."""
        return Counter(self._storage_stacks.get(method_name, []))

    def storage_names(self, method_name: str, suffix: typing.Union[str, typing.Tuple[str, ...]] = "") -> list:
        """The file names a storage method was called with, in call order - for `_save()`, the final names the
        files were stored under (after `get_available_name()` and the field's `max_length` truncation).
        `suffix` keeps only the names ending with it (or with one of them), e.g. ".webp" for the attachments."""
        return [name for name in self._storage_names.get(method_name, []) if name and name.endswith(suffix)]

    def _frame_label(self, filename: str, lineno: int, name: str) -> str:
        path = self._relpath(filename) or filename.rpartition("site-packages/")[2]
        return f"{path}:{lineno} in {name}"

    def time_breakdown(self) -> typing.Dict[str, float]:
        """Seconds spent in the queries, in the storage calls and in the rest (Python) of the profiled block."""
        db = sum(self._table_seconds.values())
        storage = sum(self._storage_seconds.values())
        return {"total": self.elapsed, "db": db, "storage": storage, "python": self.elapsed - db - storage}

    def _time_report_lines(self, per: int = 1) -> typing.List[str]:
        """`per`: also divide the timings by this count, e.g. the number of imported items."""

        def fmt(seconds):
            return f"{seconds:.2f} s" + (f" ({seconds * 1000 / per:.1f} ms/item)" if per > 1 else "")

        breakdown = self.time_breakdown()
        lines = [
            f"Time: {fmt(breakdown['total'])}",
            f"  db: {self._total_queries} queries, {fmt(breakdown['db'])}",
        ]
        for table, seconds in self._table_seconds.most_common(10):
            lines.append(f"    {table}: {self._first_table_counts[table]} queries, {fmt(seconds)}")
        lines.append(f"  storage: {sum(self._storage_counts.values())} calls, {fmt(breakdown['storage'])}")
        for method_name, count in self._storage_counts.most_common():
            lines.append(f"    {method_name}(): {count} calls")
            for frames, sites_count in self.storage_call_sites(method_name).most_common():
                labels = " < ".join(self._frame_label(*frame) for frame in frames)
                lines.append(f"      {sites_count}x {labels or '(no project frame)'}")
        lines.append(f"  python (rest): {fmt(breakdown['python'])}")

        # What the round trips to S3 and RDS would add on a deployed server
        storage_calls = sum(self._storage_counts.values())
        storage_seconds = storage_calls * self.storage_latency
        db_seconds = self._total_queries * self.db_latency
        estimated = breakdown["total"] + storage_seconds + db_seconds
        if estimated:
            calls = " + ".join(f"{count} {name}()" for name, count in self._storage_counts.most_common()) or "no call"
            lines += [
                (
                    f"If the storage was S3 ({self.storage_latency * 1000:g} ms/call) and the db remote "
                    f"({self.db_latency * 1000:g} ms/query), it would take about {fmt(estimated)}:"
                ),
                f"  S3: {calls} = {fmt(storage_seconds)}, {100 * storage_seconds / estimated:.0f}% of the time",
                (
                    f"  db round trips: {self._total_queries} queries = {fmt(db_seconds)}, "
                    f"{100 * db_seconds / estimated:.0f}% of the time"
                ),
                f"  measured here: {fmt(breakdown['total'])}, {100 * breakdown['total'] / estimated:.0f}% of the time",
            ]
        return lines

    def print_time_report(self, per: int = 1):
        print("\n".join(self._time_report_lines(per)))

    def assertLessEqualQueryCount(self, expected: typing.Dict[str, int], exclude: typing.Sequence[str] = ()) -> None:
        """
        Assert that every table in `expected` was queried at most the given number of times, AND
        that every *other* table hit (not listed in `expected`) is in `exclude`. The latter is
        what catches a regression an allow-list alone would miss: a brand new query pattern
        landing on a table nobody thought to bound. `exclude` is for tables whose query count is
        real but not worth pinning down (e.g. framework/fixture overhead unrelated to what the
        test investigates) - listing a table there means "I know about it, don't assert on it",
        as opposed to just not showing up in `expected` by oversight.

        Checks everything before failing, so the failure message lists every violation at once -
        both bounds exceeded and unaccounted-for tables - rather than just the first hit.
        """
        counts = self.table_counts()
        violations = [
            f"{table}: expected <= {max_count}, got {counts[table]}"
            for table, max_count in expected.items()
            if counts[table] > max_count
        ]
        unaccounted = sorted(set(counts) - set(expected) - set(exclude))
        violations += [f"{table}: not in `expected` or `exclude`, got {counts[table]}" for table in unaccounted]
        if violations:
            raise AssertionError("Query count(s) exceeded expected bound:\n" + "\n".join(violations))

    def assertStorageCalls(self, expected: typing.Dict[str, typing.Sequence[str]], exclude: typing.Sequence[str] = ()):
        """
        Assert that every storage method in `expected` was called with exactly these file names (in any order, but
        each as many times as listed), AND - as in `assertLessEqualQueryCount` - that every *other* method called is in
        `exclude`: an unexpected upload, download or HEAD on S3 fails the test.

        Checks everything before failing, so the failure message lists every violation at once.
        """
        violations = []
        for method_name, names in expected.items():
            actual = Counter(self._storage_names.get(method_name, []))
            if actual != Counter(names):
                violations.append(
                    f"{method_name}(): expected {sorted(names)}, got {sorted(self._storage_names.get(method_name, []))}"
                )
        unaccounted = sorted(set(self._storage_counts) - set(expected) - set(exclude))
        violations += [
            f"{method_name}(): not in `expected` or `exclude`, called with {self._storage_names[method_name]}"
            for method_name in unaccounted
        ]
        if violations:
            raise AssertionError("Unexpected storage call(s):\n" + "\n".join(violations))

    def assertStorageCounts(self, expected: typing.Dict[str, int], exclude: typing.Sequence[str] = ()) -> None:
        """
        Assert that every storage method in `expected` was called exactly the given number of times, AND - as in
        `assertLessEqualQueryCount` - that every *other* method called is in `exclude`. Exact rather than an upper
        bound, unlike the queries: each call is one S3 round trip, deterministic, so fewer calls than expected is as
        suspicious (a file no longer uploaded) as more. Use `assertStorageCalls` to also check the file names.

        Checks everything before failing, so the failure message lists every violation at once.
        """
        violations = [
            f"{method_name}(): expected {count}, got {self._storage_counts[method_name]}"
            for method_name, count in expected.items()
            if self._storage_counts[method_name] != count
        ]
        unaccounted = sorted(set(self._storage_counts) - set(expected) - set(exclude))
        violations += [
            f"{method_name}(): not in `expected` or `exclude`, got {self._storage_counts[method_name]}"
            for method_name in unaccounted
        ]
        if violations:
            raise AssertionError("Storage call count(s) differ from expected:\n" + "\n".join(violations))

    def _relpath(self, filename: str) -> typing.Optional[str]:
        relpath = os.path.relpath(filename, settings.BASE_DIR)
        return None if relpath.startswith("..") else relpath

    def _github_url(self, filename: str, lineno: int) -> typing.Optional[str]:
        if not self.github_repo:
            return None
        relpath = self._relpath(filename)
        if relpath is None:
            return None
        return f"https://github.com/{self.github_repo}/blob/{self.github_ref}/{relpath}#L{lineno}"

    def _code_snippet(self, filename: str, lineno: int) -> typing.Optional[str]:
        try:
            with open(filename) as f:
                all_lines = f.readlines()
        except OSError:
            return None
        start = max(0, lineno - 1 - self.snippet_context)
        end = min(len(all_lines), lineno + self.snippet_context)
        width = len(str(end))
        rendered = []
        for i in range(start, end):
            marker = ">" if (i + 1) == lineno else " "
            rendered.append(f"{marker} {i + 1:>{width}} | {all_lines[i].rstrip()}")
        return "\n".join(rendered)

    _SQL_BREAK_KEYWORDS = ("FROM", "WHERE", "ORDER BY", "GROUP BY", "LIMIT", "AND", "OR")

    def _format_sql(self, sql: str, line_width: int = 100) -> str:
        """
        Break a single-line SQL statement onto multiple lines - one per major clause, and the
        column list wrapped once it gets long - so the code block doesn't need horizontal
        scrolling to read. Not a real SQL parser: safe for the simple, literal-valued queries
        Django's ORM generates here, not meant for arbitrary SQL.
        """
        formatted = sql
        for keyword in self._SQL_BREAK_KEYWORDS:
            formatted = re.sub(rf"\s+({keyword})\s+", r"\n\1 ", formatted)

        wrapped_lines = []
        for line in formatted.splitlines():
            if len(line) <= line_width:
                wrapped_lines.append(line)
                continue
            parts = line.split(", ")
            current = ""
            for part in parts:
                candidate = f"{current}, {part}" if current else part
                if len(candidate) > line_width and current:
                    wrapped_lines.append(current + ",")
                    current = part
                else:
                    current = candidate
            if current:
                wrapped_lines.append(current)
        return "\n".join(wrapped_lines)

    def print_report(self):
        print(f"Total queries: {self.total_queries()}")
        print("Queries per table:")
        for table, count in self.table_counts().most_common():
            print(f"  {table}: {count}")
        for table in self.trace_tables:
            sites = self.call_sites_for_table(table)
            if sites:
                print(f"Call sites for {table}:")
                for (filename, lineno, name), count in sites.most_common():
                    print(f"  {count}x {filename}:{lineno} in {name}")
        self.print_time_report()

    def to_markdown(self, title: str = "Query report") -> str:
        """
        Render the same data as `print_report()` as markdown - table breakdown, call sites,
        and deduplicated sample queries (identical SQL + params collapsed with an occurrence
        count, which is exactly the duplicated-query signal this tool is looking for).
        """
        lines = [f"# {title}", "", f"**Total queries:** {self.total_queries()}", "", "## Queries per table", ""]
        lines += ["| table | queries |", "|---|---|"]
        for table, count in self.table_counts().most_common():
            lines.append(f"| `{table}` | {count} |")
        lines += ["", "## Time", "", "```", *self._time_report_lines(), "```"]

        for table in self.trace_tables:
            sites = self.call_sites_for_table(table)
            table_queries = self.queries_for_table(table)
            if not sites and not table_queries:
                continue

            lines += ["", f"## `{table}`", ""]

            if sites:
                lines += ["**Call sites:**", ""]
                for (filename, lineno, name), count in sites.most_common():
                    lines += self._markdown_call_site(f"- **{count}×** ", filename, lineno, name)
                lines.append("")

            if table_queries:
                sql_counts = Counter(q["sql"] for q in table_queries)
                lines += ["**Queries** (identical SQL collapsed, most frequent first):", ""]
                for sql, count in sql_counts.most_common():
                    lines.append(f"{count}×")
                    lines += ["```sql", self._format_sql(sql), "```", ""]

        for method_name, count in self._storage_counts.most_common():
            lines += ["", f"## Storage `{method_name}()`: {count} calls", "", "**Call sites** (innermost first):", ""]
            for frames, sites_count in self.storage_call_sites(method_name).most_common():
                lines.append(f"- **{sites_count}×**")
                for frame in frames:
                    lines += [f"  {line}" for line in self._markdown_call_site("- ", *frame)]
                lines.append("")

        return "\n".join(lines)

    def _markdown_call_site(self, prefix: str, filename: str, lineno: int, name: str) -> typing.List[str]:
        """A call site as a markdown list item: its location (a GitHub link for the project files) and its code."""
        github_url = self._github_url(filename, lineno)
        path = self._frame_label(filename, lineno, name).rpartition(" in ")[0]
        location = f"[`{path}`]({github_url})" if github_url else f"`{path}`"
        lines = [f"{prefix}{location} in `{name}`"]
        snippet = self._code_snippet(filename, lineno)
        if snippet:
            lines += [
                "  <details><summary>show code</summary>",
                "",
                "  ```python",
                *(f"  {line}" for line in snippet.splitlines()),
                "  ```",
                "  </details>",
                "",
            ]
        return lines

    @contextmanager
    def report_on_failure(self, markdown_filename: typing.Optional[str] = None, title: str = "Query report"):
        """
        Wrap query-count assertions: the report is only printed if one of them fails, so the
        normal test run stays quiet. Set the `QUERY_PROFILER_REPORTS` env var to always print it
        and write the markdown report, e.g. when investigating locally:
        `docker compose run --rm -e QUERY_PROFILER_REPORTS=1 iaso manage test ...`
        (`print_report()`/`write_markdown_report()` can also still be called directly.)
        """
        always_report = bool(os.environ.get("QUERY_PROFILER_REPORTS"))
        try:
            yield
        except AssertionError:
            if not always_report:
                self.print_report()
            raise
        finally:
            if always_report:
                self.print_report()
                if markdown_filename:
                    path = self.write_markdown_report(markdown_filename, title=title)
                    print(f"Markdown report written to {path}")

    def write_markdown_report(self, filename: str, title: str = "Query report") -> str:
        """
        Write `to_markdown()` to `<MEDIA_ROOT>/query_reports/<filename>` - MEDIA_ROOT is bind-mounted
        from the host (see docker-compose.yml), so the file is readable straight from the host
        checkout (VSCode, etc.) without needing to exec into the container. Overwrites on every run.
        """
        report_dir = os.path.join(settings.MEDIA_ROOT, "query_reports")
        os.makedirs(report_dir, exist_ok=True)
        path = os.path.join(report_dir, filename)
        with open(path, "w") as f:
            f.write(self.to_markdown(title=title))
        return path


# The methods of `Storage` that make a round trip to S3
STORAGE_METHODS = ("_save", "_open", "exists", "delete", "size", "listdir", "get_modified_time")


def _is_project_frame(filename: str, top_dirs: typing.Tuple[str, ...]) -> bool:
    """Whether the frame is non-test code under one of the project's `top_dirs`. Matched on the path relative to
    `BASE_DIR`, not on the absolute one: in CI, the checkout itself lives in `/home/runner/work/iaso/iaso/`."""
    relpath = os.path.relpath(filename, settings.BASE_DIR)
    parts = relpath.split(os.sep)
    return parts[0] in top_dirs and "tests" not in parts


def _latency_seconds(latency_ms: typing.Optional[float], env_var: str, default_ms: float) -> float:
    if latency_ms is None:
        latency_ms = float(os.environ.get(env_var) or default_ms)
    return latency_ms / 1000
