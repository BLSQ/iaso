from rest_framework import pagination
from rest_framework.response import Response


class EntityLocationPaginator(pagination.PageNumberPagination):
    """Paginator for entities `asLocation`.

    Note: this might be unnecessary but maintained for strict
    legacy API compatibility.
    """

    page_size_query_param = "limit"

    def get_paginated_response(self, data):
        return Response(
            {
                "result": data,
                "limit": self.page.paginator.per_page,
            }
        )


class EntityListPaginator(pagination.PageNumberPagination):
    """Paginator for the entities list.

    Similar to a default paginator but adds the "columns" attribute from the view's context.
    """

    page_size_query_param = "limit"
    # large default page_size for legacy API compatibility
    # not specifying a limit used to return everything
    page_size = 10000

    def paginate_queryset(self, queryset, request, view=None):
        """Store a reference to the view to access later."""

        self.view = view
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        columns = getattr(self.view, "entity_type_columns", [])
        return Response(
            {
                "count": self.page.paginator.count,
                "result": data,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "limit": self.page.paginator.per_page,
                "columns": columns,
            }
        )
