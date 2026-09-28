"""
Print the slowest / busiest routes or tasks from the aggregated `PerfStat` table.

Stats are collected when `PERF_STATS_ENABLED=true` (see `iaso.perf_stats`).

Usage:
  docker compose exec iaso ./manage.py perf_stats_report
  docker compose exec iaso ./manage.py perf_stats_report --days 1 --by-account --order p95
  docker compose exec iaso ./manage.py perf_stats_report --kind task --order wait
  docker compose exec iaso ./manage.py perf_stats_report --account 12 --top 50
"""

import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from iaso.models import PerfStat
from iaso.perf_stats.report import SORTS, summarize


class Command(BaseCommand):
    help = "Report latency percentiles, volumes and error rates per route or task"

    def add_arguments(self, parser):
        parser.add_argument("--kind", choices=PerfStat.Kind.values, default=PerfStat.Kind.HTTP)
        parser.add_argument("--days", type=float, default=7, help="Look back this many days (default 7)")
        parser.add_argument("--account", type=int, help="Only this account id")
        parser.add_argument("--by-account", action="store_true", help="Split rows per account")
        parser.add_argument("--by-outcome", action="store_true", help="Split rows per HTTP status / task outcome")
        parser.add_argument(
            "--merge-variants", action="store_true", help="Don't split rows per variant (export format, ...)"
        )
        parser.add_argument("--order", choices=SORTS, default="total", help="Sort key (default: total time)")
        parser.add_argument("--top", type=int, default=30)

    def handle(self, *args, **options):
        since = timezone.now() - datetime.timedelta(days=options["days"])
        stats = PerfStat.objects.filter(hour__gte=since, kind=options["kind"])
        if options["account"]:
            stats = stats.filter(account_id=options["account"])

        summaries = summarize(
            stats.iterator(),
            key=lambda stat: (
                stat.name,
                None if options["merge_variants"] else stat.variant,
                stat.account_id if options["by_account"] else None,
                stat.outcome if options["by_outcome"] else None,
            ),
            sort=options["order"],
        )
        with_wait = options["kind"] == PerfStat.Kind.TASK

        header = f"{'count':>9} {'err%':>6}"
        if not with_wait:
            header += f" {'bad%':>6}"
        header += f" {'p50':>8} {'p95':>8} {'p99':>8} {'max':>8} {'total s':>9}"
        if with_wait:
            header += f" {'wait':>8}"
        header += f" {'db%':>5} {'q/op':>6}"
        if options["by_account"]:
            header += f" {'account':>7}"
        if options["by_outcome"]:
            header += f" {'outcome':>8}"
        self.stdout.write(header + "  name")
        for summary in summaries[: options["top"]]:
            name, variant, account_id, outcome = summary.key
            line = f"{summary.count:>9} {100 * summary.error_rate:>6.1f}"
            if not with_wait:
                line += f" {100 * summary.bad_request_rate:>6.1f}"
            line += (
                f" {_ms(summary.p50)} {_ms(summary.p95)}"
                f" {_ms(summary.p99)} {_ms(summary.max_ms)} {summary.total_ms / 1000:>9.1f}"
            )
            if with_wait:
                line += f" {_ms(summary.avg_wait_ms)}"
            line += f" {100 * summary.db_share:>5.0f} {summary.queries_per_request:>6.1f}"
            if options["by_account"]:
                line += f" {'-' if account_id is None else account_id:>7}"
            if options["by_outcome"]:
                line += f" {outcome:>8}"
            self.stdout.write(f"{line}  {name}{f' ?{variant}' if variant else ''}")


def _ms(value):
    if value is None:
        return f"{'-':>8}"
    if value >= 10_000:
        return f"{value / 1000:>7.0f}s"
    return f"{value:>6.0f}ms" if value >= 10 else f"{value:>6.1f}ms"
