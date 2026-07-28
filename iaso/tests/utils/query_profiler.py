import os
import re
import traceback
import typing

from collections import Counter

from django.conf import settings
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
        profiler.print_report()

        # or drill into one table:
        profiler.queries_for_table("iaso_formversion")
        profiler.call_sites_for_table("iaso_formversion")

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

    def _wrapper(self, execute, sql, params, many, context):
        self._total_queries += 1
        self._table_counts.update(re.findall(r'(?:FROM|UPDATE|INTO)\s+"?(\w+)"?', sql, re.IGNORECASE))
        for table in self.trace_tables:
            if f'"{table}"' in sql:
                # Skip our own frames and test-code frames to land on the actual call site.
                frames = [
                    f for f in traceback.extract_stack()[:-1] if "/iaso/" in f.filename and "/tests/" not in f.filename
                ]
                self._stacks_by_table[table].append(frames[-1] if frames else None)
        return execute(sql, params, many, context)

    def __enter__(self):
        self._capture = CaptureQueriesContext(connection)
        self._capture.__enter__()
        self._wrapper_ctx = connection.execute_wrapper(self._wrapper)
        self._wrapper_ctx.__enter__()
        return self

    def __exit__(self, *exc_info):
        self._wrapper_ctx.__exit__(*exc_info)
        self._capture.__exit__(*exc_info)
        self.queries = self._capture.captured_queries
        return False

    def total_queries(self) -> int:
        return self._total_queries

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

        for table in self.trace_tables:
            sites = self.call_sites_for_table(table)
            table_queries = self.queries_for_table(table)
            if not sites and not table_queries:
                continue

            lines += ["", f"## `{table}`", ""]

            if sites:
                lines += ["**Call sites:**", ""]
                for (filename, lineno, name), count in sites.most_common():
                    relpath = self._relpath(filename) or filename
                    github_url = self._github_url(filename, lineno)
                    location = f"[`{relpath}:{lineno}`]({github_url})" if github_url else f"`{relpath}:{lineno}`"
                    lines.append(f"- **{count}×** {location} in `{name}`")

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
                lines.append("")

            if table_queries:
                sql_counts = Counter(q["sql"] for q in table_queries)
                lines += ["**Queries** (identical SQL collapsed, most frequent first):", ""]
                for sql, count in sql_counts.most_common():
                    lines.append(f"{count}×")
                    lines += ["```sql", self._format_sql(sql), "```", ""]

        return "\n".join(lines)

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
