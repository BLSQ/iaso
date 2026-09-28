from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Value
from django.db.models.functions import Coalesce


class PerfStat(models.Model):
    """Hourly performance aggregate of operations (HTTP requests, background tasks), see ``iaso.perf_stats``.

    One row per (hour, kind, name, variant, outcome, account, project). ``buckets`` is a latency histogram (see
    ``iaso.perf_stats.histogram``) from which percentiles are computed after summing rows.

    The table can live in a separate database (``PERF_STATS_DATABASE_URL``), so accounts and projects are plain ids
    instead of foreign keys: rows of deleted accounts are cleaned by ``delete_accounts`` and otherwise expire with the
    retention.

    Rows are upserted with raw SQL by ``iaso.perf_stats.collector``: keep the unique constraint in sync with its
    ``ON CONFLICT`` clause.
    """

    class Kind(models.TextChoices):
        HTTP = "http", "HTTP"
        TASK = "task", "Task"

    # Upserts consume a sequence value even when they update an existing row.
    id = models.BigAutoField(primary_key=True)
    hour = models.DateTimeField()
    kind = models.CharField(max_length=16, choices=Kind.choices)
    # HTTP: "<method> <route pattern>", task: "<module>.<function>"
    name = models.CharField(max_length=255)
    # HTTP: allow-listed query params changing what the endpoint does, e.g. `xlsx` or `format=csv` (see
    # `PERF_STATS_VARIANT_PARAMS`), so that exports aren't mixed with regular JSON calls. Empty when none.
    variant = models.CharField(max_length=100, blank=True, default="")
    # HTTP: status code, task: final status (SUCCESS, ERRORED, KILLED...)
    outcome = models.CharField(max_length=16)
    # HTTP: account of the project resolved from `app_id` when present, otherwise of the authenticated user.
    account_id = models.IntegerField(null=True, blank=True)
    project_id = models.IntegerField(null=True, blank=True)

    count = models.BigIntegerField(default=0)
    errors = models.BigIntegerField(default=0)
    sum_ms = models.FloatField(default=0)
    max_ms = models.FloatField(default=0)
    # Time spent waiting before being processed (tasks: queued to started).
    sum_wait_ms = models.FloatField(default=0)
    max_wait_ms = models.FloatField(default=0)
    sum_db_ms = models.FloatField(default=0)
    sum_db_queries = models.BigIntegerField(default=0)
    buckets = ArrayField(models.IntegerField())

    class Meta:
        constraints = [
            models.UniqueConstraint(
                "hour",
                "kind",
                "name",
                "variant",
                "outcome",
                Coalesce("account_id", Value(0)),
                Coalesce("project_id", Value(0)),
                name="perf_stat_unique_key",
            ),
        ]
        indexes = [models.Index(fields=["account_id", "hour"])]

    def __str__(self):
        return f"{self.hour:%Y-%m-%d %H:00} {self.kind} {self.name} {self.variant} {self.outcome}"
