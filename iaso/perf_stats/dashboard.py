"""Context of the performance dashboard in the Django admin (``PerfStatAdmin.dashboard_view``).

One tab per kind (HTTP requests, background tasks), each with three levels driven by query params so every view can
be linked:
- all accounts (or all routes / tasks, with ``view=names``),
- one account (``account=<id>`` or ``account=none`` for unattributed operations): its routes / tasks,
- one route / task (``name``, optionally within an account): timeline, latency histogram and breakdowns.

Charts are plain SVG geometry computed here, so the page needs no JavaScript nor external assets.
"""

import datetime

from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

from django.utils import timezone

from iaso.models import Account, PerfStat
from iaso.perf_stats.histogram import OVERFLOW_INDEX, upper_bound_ms
from iaso.perf_stats.report import SORTS, Bins, Summary, summarize, summarize_total


@dataclass(frozen=True)
class Period:
    label: str
    days: int
    bin_hours: int


@dataclass(frozen=True)
class KindLabels:
    tab: str
    name: str  # what the `name` column holds
    names: str
    operations: str  # what is counted
    errors: str
    outcome: str
    has_wait: bool
    has_bad_requests: bool


PERIODS = {
    "24h": Period("24 hours", 1, 1),
    "7d": Period("7 days", 7, 6),
    "30d": Period("30 days", 30, 24),
}
DEFAULT_PERIOD = "7d"
KINDS = {
    PerfStat.Kind.HTTP: KindLabels(
        "HTTP requests", "Route", "routes", "requests", "5xx", "status", has_wait=False, has_bad_requests=True
    ),
    PerfStat.Kind.TASK: KindLabels(
        "Tasks", "Task", "tasks", "runs", "Failed", "outcome", has_wait=True, has_bad_requests=False
    ),
}
NO_ACCOUNT = "none"
MAX_ROWS = 200


def format_ms(value: Optional[float]) -> str:
    if value is None:
        return "-"
    if value >= 3_600_000:
        return f"{value / 3_600_000:.1f} h"
    if value >= 60_000:
        return f"{value / 60_000:.1f} min"
    if value >= 10_000:
        return f"{value / 1000:.0f} s"
    if value >= 1000:
        return f"{value / 1000:.1f} s"
    if value >= 10:
        return f"{value:.0f} ms"
    return f"{value:.1f} ms"


def format_total(ms: float) -> str:
    seconds = ms / 1000
    if seconds >= 3600:
        return f"{seconds / 3600:.1f} h"
    if seconds >= 60:
        return f"{seconds / 60:.1f} min"
    return f"{seconds:.1f} s"


def format_percent(ratio: float) -> str:
    if ratio == 0:
        return "0%"
    return f"{100 * ratio:.1f}%" if ratio < 0.1 else f"{100 * ratio:.0f}%"


def summary_cells(summary: Summary) -> dict:
    return {
        "count": f"{summary.count:,}",
        "total": format_total(summary.total_ms),
        "avg": format_ms(summary.avg_ms),
        "p50": format_ms(summary.p50),
        "p95": format_ms(summary.p95),
        "max": format_ms(summary.max_ms),
        "errors": format_percent(summary.error_rate),
        "has_errors": summary.errors > 0,
        "bad_requests": format_percent(summary.bad_request_rate),
        "has_bad_requests": summary.bad_requests > 0,
        "bad_requests_title": " · ".join(
            f"{status}: {count:,}" for status, count in sorted(summary.bad_requests_per_status.items())
        ),
        "wait": format_ms(summary.avg_wait_ms),
        "max_wait": format_ms(summary.max_wait_ms),
        "queries": f"{summary.queries_per_request:.1f}",
        "db_share": format_percent(summary.db_share),
    }


def bar_chart(values: list[float], titles: list[str], height: int = 60) -> dict:
    """SVG geometry for a bar chart in a ``0 0 width height`` viewBox (1 unit wide bars, stretched by CSS)."""
    peak = max(values, default=0) or 1
    bars = []
    for index, (value, title) in enumerate(zip(values, titles)):
        bar_height = value / peak * height
        if value and bar_height < 1:
            bar_height = 1  # keep non-zero bins visible
        bars.append({"x": index + 0.1, "y": height - bar_height, "height": bar_height, "title": title})
    return {"width": len(values), "height": height, "bars": bars}


def sparkline(values: list[float], width: int = 100, height: int = 20) -> str:
    peak = max(values, default=0) or 1
    step = width / max(len(values) - 1, 1)
    return " ".join(f"{i * step:.1f},{height - value / peak * (height - 2) - 1:.1f}" for i, value in enumerate(values))


def bucket_label(index: int) -> str:
    if index == 0:
        return "≤ 1 ms"
    if index == OVERFLOW_INDEX:
        return f"> {format_ms(upper_bound_ms(index - 1))}"
    return f"≤ {format_ms(upper_bound_ms(index))}"


class Dashboard:
    def __init__(self, params, now: Optional[datetime.datetime] = None):
        self.period_key = params.get("period") if params.get("period") in PERIODS else DEFAULT_PERIOD
        self.period = PERIODS[self.period_key]
        self.kind = params.get("kind") if params.get("kind") in KINDS else PerfStat.Kind.HTTP
        self.labels = KINDS[self.kind]
        self.sort = params.get("sort") if params.get("sort") in SORTS else "total"
        self.account = params.get("account", "")
        self.name = params.get("name", "")
        self.view = "names" if params.get("view") == "names" else "accounts"

        end = (now or timezone.now()).replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
        self.bins = Bins(
            start=end - datetime.timedelta(days=self.period.days),
            hours=self.period.bin_hours,
            count=self.period.days * 24 // self.period.bin_hours,
        )
        self.account_names: dict[int, str] = {}

    def url(self, **overrides) -> str:
        """URL of this dashboard with the current params and `overrides` applied (an empty value removes the param)."""
        params = {
            "kind": self.kind if self.kind != PerfStat.Kind.HTTP else "",
            "period": self.period_key,
            "sort": self.sort,
            "account": self.account,
            "name": self.name,
            "view": self.view if self.view == "names" else "",
        }
        params.update(overrides)
        return "?" + urlencode({key: value for key, value in params.items() if value})

    def stats(self) -> list[PerfStat]:
        stats = PerfStat.objects.filter(hour__gte=self.bins.start, kind=self.kind)
        if self.account == NO_ACCOUNT:
            stats = stats.filter(account_id__isnull=True)
        elif self.account.isdigit():
            stats = stats.filter(account_id=int(self.account))
        if self.name:
            stats = stats.filter(name=self.name)
        return list(stats)

    def account_name(self, account_id: Optional[int]) -> str:
        if account_id is None:
            return "(no account)"
        return self.account_names.get(account_id, f"#{account_id}")

    def context(self) -> dict:
        stats = self.stats()
        account_ids = {stat.account_id for stat in stats if stat.account_id}
        if self.account.isdigit():
            account_ids.add(int(self.account))
        # Separate query: stats may be stored in another database than accounts.
        self.account_names = dict(Account.objects.filter(id__in=account_ids).values_list("id", "name"))

        total = summarize_total(stats, bins=self.bins)
        context = {
            "labels": self.labels,
            "kinds": [
                (labels.tab, self.url(kind=kind, name="", sort="", view=""), kind == self.kind)
                for kind, labels in KINDS.items()
            ],
            "period": self.period,
            "periods": [(key, period.label, self.url(period=key)) for key, period in PERIODS.items()],
            "period_key": self.period_key,
            "total": summary_cells(total),
            "timeline": self.timeline_chart(total.timeline),
            "breadcrumbs": self.breadcrumbs(),
            "has_data": bool(stats),
        }
        if self.name:
            context.update(self.name_context(stats))
            context["level"] = "name"
        elif self.account or self.view == "names":
            context.update(self.table(stats, by="name"))
            context["level"] = "names"
            context["view_links"] = [] if self.account else self.view_links()
        else:
            context.update(self.table(stats, by="account"))
            context["level"] = "accounts"
            context["view_links"] = self.view_links()
        return context

    def view_links(self) -> list[tuple[str, str, bool]]:
        return [
            ("Per account", self.url(view=""), self.view == "accounts"),
            (f"Per {self.labels.name.lower()}", self.url(view="names"), self.view == "names"),
        ]

    def breadcrumbs(self) -> list[tuple[str, Optional[str]]]:
        crumbs = [("All accounts", self.url(account="", name="", view="") if self.account or self.name else None)]
        if self.account:
            name = self.account_name(int(self.account)) if self.account.isdigit() else "(no account)"
            crumbs.append((name, self.url(name="") if self.name else None))
        if self.name:
            crumbs.append((self.name, None))
        return crumbs

    def timeline_titles(self, values: list[float], formatter) -> list[str]:
        titles = []
        for index, value in enumerate(values):
            start = timezone.localtime(self.bins.bin_start(index))
            titles.append(f"{start:%a %d %b %H:%M}: {formatter(value)}")
        return titles

    def timeline_chart(self, values: list[float]) -> dict:
        chart = bar_chart(values, self.timeline_titles(values, format_total))
        chart["start"] = timezone.localtime(self.bins.start)
        chart["end"] = timezone.localtime(self.bins.bin_start(self.bins.count))
        return chart

    def headers(self) -> list[dict]:
        columns = [
            ("count", self.labels.operations.capitalize()),
            ("total", "Total time"),
            ("avg", "Avg"),
            (None, "p50"),
            ("p95", "p95"),
            ("max", "Max"),
            ("errors", self.labels.errors),
        ]
        if self.labels.has_bad_requests:
            columns += [("bad_requests", "Bad req.")]
        if self.labels.has_wait:
            columns += [("wait", "Avg wait"), (None, "Max wait")]
        columns += [("queries", "Queries/run" if self.labels.has_wait else "Queries/req"), (None, "DB time")]
        return [
            {"label": label, "url": self.url(sort=key) if key else None, "active": key == self.sort}
            for key, label in columns
        ]

    def table(self, stats: list[PerfStat], by: str) -> dict:
        if by == "account":
            summaries = summarize(stats, key=lambda stat: stat.account_id, sort=self.sort, bins=self.bins)
            rows = [
                {
                    "label": self.account_name(summary.key),
                    "url": self.url(account=NO_ACCOUNT if summary.key is None else str(summary.key), view=""),
                    "cells": summary_cells(summary),
                    "sparkline": sparkline(summary.timeline),
                }
                for summary in summaries
            ]
        else:
            summaries = summarize(stats, key=lambda stat: (stat.name, stat.variant), sort=self.sort, bins=self.bins)
            rows = [
                {
                    "label": summary.key[0],
                    "variant": summary.key[1],
                    "url": self.url(name=summary.key[0]),
                    "cells": summary_cells(summary),
                    "sparkline": sparkline(summary.timeline),
                }
                for summary in summaries
            ]
        return {
            "headers": self.headers(),
            "rows": rows[:MAX_ROWS],
            "truncated": len(rows) > MAX_ROWS,
            "first_column": "Account" if by == "account" else self.labels.name,
            "show_variant": by == "name",
            "with_trend": True,
        }

    def name_context(self, stats: list[PerfStat]) -> dict:
        per_bin = {summary.key: summary for summary in summarize(stats, key=lambda stat: self.bins.index(stat.hour))}
        counts = [per_bin[i].count if i in per_bin else 0 for i in range(self.bins.count)]
        p95s = [(per_bin[i].p95 or 0) if i in per_bin else 0 for i in range(self.bins.count)]
        operations = self.labels.operations

        total = summarize_total(stats)
        buckets = total.agg.buckets
        used = [index for index, count in enumerate(buckets) if count]
        histogram = None
        if used:
            indexes = range(used[0], used[-1] + 1)
            histogram = bar_chart(
                [buckets[i] for i in indexes], [f"{bucket_label(i)}: {buckets[i]:,} {operations}" for i in indexes]
            )
            histogram["first"] = bucket_label(used[0])
            histogram["last"] = bucket_label(used[-1])

        breakdowns = [
            ("Per variant", lambda stat: stat.variant or "(plain)", None),
            (f"Per {self.labels.outcome}", lambda stat: stat.outcome, None),
        ]
        if not self.account:
            breakdowns.append(
                (
                    "Per account",
                    lambda stat: stat.account_id,
                    lambda key: (self.account_name(key), self.url(account=NO_ACCOUNT if key is None else str(key))),
                )
            )
        return {
            "count_chart": bar_chart(counts, self.timeline_titles(counts, lambda v: f"{v:,} {operations}")),
            "p95_chart": bar_chart(p95s, self.timeline_titles(p95s, format_ms)),
            "histogram": histogram,
            "headers": self.headers(),
            "breakdowns": [
                {
                    "title": title,
                    "rows": [
                        {
                            **(dict(zip(("label", "url"), link(summary.key))) if link else {"label": summary.key}),
                            "cells": summary_cells(summary),
                        }
                        for summary in summarize(stats, key=key, sort=self.sort)
                    ],
                }
                for title, key, link in breakdowns
            ],
        }
