from datetime import datetime

from django.utils.timezone import make_aware
from rest_framework import serializers, pagination
from rest_framework.response import Response


class TimestampField(serializers.Field):
    def to_representation(self, value: datetime):
        return value.timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data))


class Paginator(pagination.PageNumberPagination):
    page_size_query_param = "limit"
    results_response_key = "results"

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            self.results_response_key: data,
            "has_next": self.page.has_next(),
            "has_previous": self.page.has_previous(),
            "page": self.page.number,
            "pages": self.page.paginator.num_pages,
            "limit": self.page.paginator.per_page
        })
