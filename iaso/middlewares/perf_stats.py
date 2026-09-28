import logging
import re
import time

from functools import lru_cache

from django.conf import settings
from django.core.exceptions import MiddlewareNotUsed

from iaso.models import PerfStat
from iaso.perf_stats.collector import collector
from iaso.perf_stats.db_timer import DbTimer


logger = logging.getLogger(__name__)

UNMATCHED_ROUTE = "<unmatched>"
KNOWN_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"}
NAMED_GROUP_RE = re.compile(r"\(\?P<(\w+)>[^()]*\)")
VARIANT_VALUE_RE = re.compile(r"[a-z0-9_.-]{1,20}")
TRUTHY_VALUES = {"true", "1", "yes", "on"}


@lru_cache(maxsize=4096)
def normalize_route(route: str) -> str:
    """Make regex routes (DRF routers, `re_path`) readable: `^api/forms/(?P<pk>[^/.]+)/$` -> `api/forms/<pk>/`."""
    route = NAMED_GROUP_RE.sub(r"<\1>", route)
    return route.lstrip("^").rstrip("$")[:255]


def request_variant(params, variant_params) -> str:
    """Describe the allow-listed params of a request: `?xlsx=true&order=name` -> `xlsx`, `?format=csv` -> `format=csv`.

    Only empty values are ignored: most views use `bool(query_params.get("csv"))`, so even `csv=false` triggers the
    export. Values that aren't short identifiers are recorded as `?` to keep the number of distinct variants bounded.
    """
    parts = []
    for name in variant_params:
        value = params.get(name)
        if value is None:
            continue
        value = value.strip().lower()
        if not value:
            continue
        if value in TRUTHY_VALUES:
            parts.append(name)
        else:
            parts.append(f"{name}={value if VARIANT_VALUE_RE.fullmatch(value) else '?'}")
    return "&".join(parts)[:100]


class PerfStatsMiddleware:
    """Record duration, status and DB usage of each request, aggregated per route pattern and account.

    Enabled with the `PERF_STATS_ENABLED` setting. See `iaso.perf_stats.collector` for how stats are stored.
    """

    def __init__(self, get_response):
        if not settings.PERF_STATS_ENABLED:
            raise MiddlewareNotUsed
        self.get_response = get_response
        self.excluded_prefixes = tuple(settings.PERF_STATS_EXCLUDED_PATH_PREFIXES)
        self.variant_params = tuple(settings.PERF_STATS_VARIANT_PARAMS)

    def __call__(self, request):
        if request.method == "OPTIONS" or request.path.startswith(self.excluded_prefixes):
            return self.get_response(request)

        db_timer = DbTimer()
        start = time.perf_counter()
        with db_timer.measure():
            response = self.get_response(request)
        duration_ms = (time.perf_counter() - start) * 1000

        try:
            self.record(request, response, duration_ms, db_timer, self.variant_params)
        except Exception:
            logger.exception("Could not record perf stats")
        return response

    @staticmethod
    def record(request, response, duration_ms, db_timer, variant_params):
        match = request.resolver_match
        route = normalize_route(match.route) if match and match.route else UNMATCHED_ROUTE
        # DRF authenticates inside the view (token/JWT) and propagates the user to the Django request, so reading it
        # after the response also covers mobile clients.
        user = getattr(request, "user", None)
        user_id = user.pk if user is not None and user.is_authenticated else None
        app_id = request.GET.get("app_id") or None
        method = request.method if request.method in KNOWN_METHODS else "OTHER"
        collector.record(
            kind=PerfStat.Kind.HTTP,
            name=f"{method} {route}"[:255],
            outcome=str(response.status_code),
            error=response.status_code >= 500,
            variant=request_variant(request.GET, variant_params),
            duration_ms=duration_ms,
            db_ms=db_timer.duration_ms,
            db_queries=db_timer.queries,
            user_id=user_id,
            app_id=app_id[:255] if app_id else None,
        )
