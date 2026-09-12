from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from iaso.api.common.pagination import Paginator


TRUE_VALUES = ("true", "1", "yes")


class V3PagePagination(Paginator):
    """Page-based pagination for v3 endpoints.

    Subclasses `iaso.api.common.pagination.Paginator` (itself a `PageNumberPagination`) so it satisfies
    `ReadOnlyModelViewSet`'s `pagination_class` type, but overrides every method: unlike `Paginator`, this
    does not run a mandatory `COUNT(*)` query on every request - by default `count`/`pages` are `null` and
    `has_next` is derived by fetching one extra row per page. Pass `?with_count=true` to get an exact
    `count` (one extra COUNT query).
    """

    page_size = 100
    max_page_size = 10_000
    page_size_query_param = "page_size"
    results_key = "results"

    def get_results_key(self):
        view = self.request.parser_context.get("view") if getattr(self, "request", None) else None
        return getattr(view, "results_key", None) or self.results_key

    def with_count(self, request):
        return str(request.query_params.get("with_count", "")).lower() in TRUE_VALUES

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request
        page_size = self.get_page_size(request)
        if not page_size:
            return None

        try:
            page_number = int(request.query_params.get(self.page_query_param, 1))
        except (TypeError, ValueError):
            page_number = 1
        if page_number < 1:
            raise NotFound(f"Invalid page number: must be >= 1, got {request.query_params.get(self.page_query_param)}")

        offset = (page_number - 1) * page_size
        # Fetch one row past the page to know if there's a next page, without a COUNT(*) query.
        rows = list(queryset[offset : offset + page_size + 1])

        if not rows and page_number > 1:
            raise NotFound(f"Page {page_number} is out of range (no results at this offset)")

        self.page_number = page_number
        self.page_size = page_size
        self.has_next_page = len(rows) > page_size
        self.count = queryset.count() if self.with_count(request) else None
        self.num_pages = -(-self.count // page_size) if self.count is not None else None  # ceil division

        return rows[:page_size]

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.count,
                self.get_results_key(): data,
                "has_next": self.has_next_page,
                "has_previous": self.page_number > 1,
                "page": self.page_number,
                "pages": self.num_pages,
                "page_size": self.page_size,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "count": {
                    "type": "integer",
                    "nullable": True,
                    "description": "Exact total, only computed when `with_count=true` was passed.",
                },
                "has_next": {"type": "boolean"},
                "has_previous": {"type": "boolean"},
                "page": {"type": "integer", "example": 1},
                "pages": {
                    "type": "integer",
                    "nullable": True,
                    "description": "Only computed when `with_count=true` was passed.",
                },
                "page_size": {"type": "integer", "example": 100},
                self.get_results_key(): schema,
            },
        }
