from collections import defaultdict

from querycount.middleware import QueryCountMiddleware


def _empty_stats():
    return {"writes": 0, "reads": 0, "total": 0, "duplicates": 0}


class SafeQueryCountMiddleware(QueryCountMiddleware):
    """QueryCountMiddleware that handles dynamically added database aliases.

    The upstream middleware builds a fixed stats dict at __init__ time from
    the aliases known to ``connections.all()``. When a database alias is
    registered dynamically, ``_count_queries`` crashes with a KeyError.
    This subclass uses ``defaultdict`` so that any alias access auto-creates
    its stats entry.
    """

    def _reset_stats(self):
        super()._reset_stats()
        self.stats["request"] = defaultdict(_empty_stats, self.stats["request"])
        self.stats["response"] = defaultdict(_empty_stats, self.stats["response"])
