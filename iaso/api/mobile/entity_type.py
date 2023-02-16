from django.core.exceptions import ValidationError
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, status
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from iaso.api.common import (
    ModelViewSet,
    TimestampField,
)
from iaso.api.mobile.entity import MobileEntitySerializer
from iaso.models import Entity, Instance, EntityType
from iaso.utils.jsonlogic import jsonlogic_to_q


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = "page_size"
    max_page_size = 1000


class MobileEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = [
            "name",
            "created_at",
            "updated_at",
            "reference_form",
            "account",
            "is_active",
        ]

    created_at = TimestampField()
    updated_at = TimestampField()


class MobileEntityTypesViewSet(ModelViewSet):
    """
    Mobile API to Serve Entity Types.

    /api/mobile/entitytypes

    /api/mobile/entitytypes/id

    It's possible to get all entities of a given type :

    /api/mobile/entitytypes/id/entities
    """
    results_key = "entitytypes"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    pagination_class = LargeResultsSetPagination

    def get_serializer_class(self):
        return MobileEntityTypeSerializer

    def get_queryset(self):

        queryset = EntityType.objects.filter(account=self.request.user.iaso_profile.account)

        return queryset

    @action(detail=False, methods=["get"], url_path=r"(?P<type_pk>\d+)/entities")
    def get_entities_by_types(self, *args, **kwargs):
        limit_date = self.request.query_params.get("limit_date", None)
        json_content = self.request.query_params.get("json_content", None)
        type_pk = self.request.parser_context.get("kwargs")["type_pk"]
        p = Prefetch(
            "instances",
            queryset=Instance.objects.filter(deleted=False).exclude(file=""),
            to_attr="non_deleted_instances",
        )

        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account, entity_type__pk=type_pk)
        queryset = queryset.prefetch_related(p).prefetch_related("non_deleted_instances__form")

        if limit_date:
            try:
                queryset = queryset.filter(instances__updated_at__gte=limit_date)
            except ValidationError:
                return Response("Error in limit date format", status.HTTP_400_BAD_REQUEST)

        if json_content:
            try:
                q = jsonlogic_to_q(jsonlogic=json_content, field_prefix="json__")  # type: ignore
                queryset = queryset.filter(q)
            except ValidationError:
                return Response("Error in json logic format", status.HTTP_400_BAD_REQUEST)

        page = self.paginate_queryset(queryset)

        serializer = MobileEntitySerializer(page, many=True)

        return self.get_paginated_response(serializer.data)
