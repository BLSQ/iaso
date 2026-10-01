from django.conf import settings


def is_perf_stat(app_label: str, model_name: str) -> bool:
    return app_label == "iaso" and model_name == "perfstat"


class PerfStatsRouter:
    """Send `PerfStat` to `settings.PERF_STATS_DATABASE`, which is `default` unless `PERF_STATS_DATABASE_URL` is set.

    With a separate database, only the `PerfStat` table is migrated there and it's left out of `default`.
    """

    def db_for_read(self, model, **hints):
        if is_perf_stat(model._meta.app_label, model._meta.model_name):
            return settings.PERF_STATS_DATABASE
        return None

    db_for_write = db_for_read

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if settings.PERF_STATS_DATABASE == "default":
            return None
        if db == settings.PERF_STATS_DATABASE:
            return is_perf_stat(app_label, model_name)
        if is_perf_stat(app_label, model_name):
            return False
        return None
