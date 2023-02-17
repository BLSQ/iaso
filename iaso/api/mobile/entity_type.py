from django.core.exceptions import ValidationError
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, status
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import (
    ModelViewSet,
    TimestampField,
)
from iaso.api.mobile.entity import MobileEntitySerializer, LargeResultsSetPagination, mobile_entity_get_queryset
from iaso.models import Entity, Instance, EntityType
from iaso.utils.jsonlogic import jsonlogic_to_q


class MobileEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "reference_form",
            "entities_count",
            "account",
            "fields_detail_info_view",
            "fields_list_view",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    entities_count = serializers.SerializerMethodField()

    @staticmethod
    def get_entities_count(obj: EntityType):
        return Entity.objects.filter(entity_type=obj.id).count()


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
        queryset = mobile_entity_get_queryset(self.request, *args, **kwargs)
        page = self.paginate_queryset(queryset)
        serializer = MobileEntitySerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
