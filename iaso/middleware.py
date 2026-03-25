from collections import defaultdict

from django.urls import Resolver404, resolve
from djangorestframework_camel_case.middleware import CamelCaseMiddleWare
from querycount.middleware import QueryCountMiddleware


class CustomCamelCaseMiddleWare(CamelCaseMiddleWare):
    def __call__(self, request):
        # we only execute this middleware on profiles API at the moment
        route = ""
        try:
            route = resolve(request.path_info).route
        except Resolver404:
            pass

        if route.startswith(("/api/v2/profiles", "/api/validation-workflows")):
            return super().__call__(request)
        return self.get_response(request)


class SafeQueryCountMiddleware(QueryCountMiddleware):
    """QueryCountMiddleware that handles dynamically added database aliases.

    The upstream middleware builds a fixed stats dict at __init__ time from
    the aliases known to ``connections.all()``. When a database alias is
    registered dynamically, ``_count_queries`` crashes with a KeyError.
    This subclass uses ``defaultdict`` so that any alias access auto-creates
    its stats entry.
    """

    @staticmethod
    def _empty_stats():
        return {"writes": 0, "reads": 0, "total": 0, "duplicates": 0}

    def _reset_stats(self):
        super()._reset_stats()
        self.stats["request"] = defaultdict(self._empty_stats, self.stats["request"])
        self.stats["response"] = defaultdict(self._empty_stats, self.stats["response"])
