from rest_framework import pagination
from rest_framework.response import Response


class Paginator(pagination.PageNumberPagination):
    page_size_query_param = "limit"

    def __init__(self, results_key="results"):
        self.results_key = results_key

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                self.results_key: data,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "limit": self.page.paginator.per_page,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "count": {
                    "type": "integer",
                    "example": 123,
                },
                "has_next": {
                    "type": "boolean",
                },
                "has_previous": {
                    "type": "boolean",
                },
                "limit": {
                    "type": "integer",
                    "example": 123,
                },
                "page": {
                    "type": "integer",
                    "example": 2,
                    "description": "The current page number",
                },
                "pages": {
                    "type": "integer",
                    "example": 2,
                    "description": "The total number of pages",
                },
                self.results_key: schema,
            },
        }


class EtlPaginator(Paginator):
    page_size = 20
    max_page_size = 1000
