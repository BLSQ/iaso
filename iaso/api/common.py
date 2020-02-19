from datetime import datetime

from django.utils.timezone import make_aware
from rest_framework import serializers, pagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet as BaseModelViewSet


class TimestampField(serializers.Field):
    def to_representation(self, value: datetime):
        return value.timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data))


class Paginator(pagination.PageNumberPagination):
    page_size_query_param = "limit"

    def __init__(self, results_key):
        self.results_key = results_key

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            self.results_key: data,
            "has_next": self.page.has_next(),
            "has_previous": self.page.has_previous(),
            "page": self.page.number,
            "pages": self.page.paginator.num_pages,
            "limit": self.page.paginator.per_page
        })


class ModelViewSet(BaseModelViewSet):
    results_key = None

    def pagination_class(self):
        return Paginator(self.get_results_key())

    def get_results_key(self):
        """
        Get the key to use for results in list responses (resource-specific)

        Example: if your resource is CarManufacturer, use "car_manufacturers", so that the list responses look like
        {
            "car_manufacturers": [
                {"id": 1, name: "Honda"},
                {"id": 2, name: "Toyota"},
            ]
        }
        """
        assert self.results_key is not None, (
                "'%s' should either include a `results_key` attribute, "
                "or override the `get_result_key()` method."
                % self.__class__.__name__
        )

        return self.results_key

    def list(self, request: Request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({self.get_results_key(): serializer.data})
