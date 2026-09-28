"""Group ``PerfStat`` rows and compute totals / percentiles, shared by the admin dashboard and the report command.

Percentiles can't be stored per row and averaged, so rows are grouped in Python: their histograms are summed and the
percentiles computed on the result (see ``iaso.perf_stats.histogram``).
"""

import datetime

from collections import Counter
from dataclasses import dataclass, field
from typing import Callable, Hashable, Iterable, Optional

from iaso.models import PerfStat
from iaso.perf_stats.collector import Aggregate
from iaso.perf_stats.histogram import percentile


# 4xx responses that are about access rather than usage (not logged in, no permission, unknown id).
NOT_BAD_REQUEST_STATUSES = {"401", "403", "404"}


def is_bad_request(stat: PerfStat) -> bool:
    """A client error caused by how the API is used (400 invalid payload, 409 conflict, 413 too large...)."""
    return (
        stat.kind == PerfStat.Kind.HTTP
        and stat.outcome.startswith("4")
        and stat.outcome not in NOT_BAD_REQUEST_STATUSES
    )


@dataclass
class Summary:
    key: Hashable = None
    agg: Aggregate = field(default_factory=Aggregate)
    # Total time (ms) per time bin, when summarizing with `Bins`.
    timeline: Optional[list[float]] = None
    # Count of bad requests (see `is_bad_request`) per status code.
    bad_requests_per_status: Counter = field(default_factory=Counter)

    def add(self, stat: PerfStat) -> None:
        self.agg.merge(
            Aggregate(
                count=stat.count,
                errors=stat.errors,
                sum_ms=stat.sum_ms,
                max_ms=stat.max_ms,
                sum_wait_ms=stat.sum_wait_ms,
                max_wait_ms=stat.max_wait_ms,
                sum_db_ms=stat.sum_db_ms,
                sum_db_queries=stat.sum_db_queries,
                buckets=list(stat.buckets),
            )
        )
        if is_bad_request(stat):
            self.bad_requests_per_status[stat.outcome] += stat.count

    @property
    def count(self) -> int:
        return self.agg.count

    @property
    def total_ms(self) -> float:
        return self.agg.sum_ms

    @property
    def max_ms(self) -> float:
        return self.agg.max_ms

    @property
    def avg_ms(self) -> Optional[float]:
        return self.agg.sum_ms / self.agg.count if self.agg.count else None

    @property
    def p50(self) -> Optional[float]:
        return percentile(self.agg.buckets, 0.5, self.agg.max_ms)

    @property
    def p95(self) -> Optional[float]:
        return percentile(self.agg.buckets, 0.95, self.agg.max_ms)

    @property
    def p99(self) -> Optional[float]:
        return percentile(self.agg.buckets, 0.99, self.agg.max_ms)

    @property
    def errors(self) -> int:
        return self.agg.errors

    @property
    def error_rate(self) -> float:
        return self.agg.errors / self.agg.count if self.agg.count else 0.0

    @property
    def bad_requests(self) -> int:
        return sum(self.bad_requests_per_status.values())

    @property
    def bad_request_rate(self) -> float:
        return self.bad_requests / self.agg.count if self.agg.count else 0.0

    @property
    def avg_wait_ms(self) -> Optional[float]:
        return self.agg.sum_wait_ms / self.agg.count if self.agg.count else None

    @property
    def max_wait_ms(self) -> float:
        return self.agg.max_wait_ms

    @property
    def db_share(self) -> float:
        return self.agg.sum_db_ms / self.agg.sum_ms if self.agg.sum_ms else 0.0

    @property
    def queries_per_request(self) -> float:
        return self.agg.sum_db_queries / self.agg.count if self.agg.count else 0.0


SORTS: dict[str, Callable[[Summary], float]] = {
    "total": lambda s: s.total_ms,
    "count": lambda s: s.count,
    "avg": lambda s: s.avg_ms or 0,
    "p95": lambda s: s.p95 or 0,
    "max": lambda s: s.max_ms,
    "errors": lambda s: s.error_rate,
    "bad_requests": lambda s: s.bad_request_rate,
    "queries": lambda s: s.queries_per_request,
    "wait": lambda s: s.avg_wait_ms or 0,
}


@dataclass
class Bins:
    """Splits ``[start, start + count * hours)`` in ``count`` bins of ``hours`` hours."""

    start: datetime.datetime
    hours: int
    count: int

    def index(self, hour: datetime.datetime) -> int:
        index = int((hour - self.start).total_seconds() // (3600 * self.hours))
        return min(max(index, 0), self.count - 1)

    def bin_start(self, index: int) -> datetime.datetime:
        return self.start + datetime.timedelta(hours=index * self.hours)


def summarize(
    stats: Iterable[PerfStat],
    key: Callable[[PerfStat], Hashable],
    sort: str = "total",
    bins: Optional[Bins] = None,
) -> list[Summary]:
    """One ``Summary`` per distinct ``key(stat)``, sorted by ``sort`` (descending)."""
    summaries: dict[Hashable, Summary] = {}
    for stat in stats:
        stat_key = key(stat)
        summary = summaries.get(stat_key)
        if summary is None:
            summary = summaries[stat_key] = Summary(key=stat_key, timeline=[0.0] * bins.count if bins else None)
        summary.add(stat)
        if bins:
            summary.timeline[bins.index(stat.hour)] += stat.sum_ms
    return sorted(summaries.values(), key=SORTS[sort], reverse=True)


def summarize_total(stats: Iterable[PerfStat], bins: Optional[Bins] = None) -> Summary:
    summaries = summarize(stats, key=lambda stat: None, bins=bins)
    if summaries:
        return summaries[0]
    return Summary(timeline=[0.0] * bins.count if bins else None)
