import json

from django.core.exceptions import ValidationError
from django.db.models import Prefetch
from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination

from iaso.api.common import (
    ModelViewSet,
    DeletionFilterBackend,
    TimestampField,
)
from iaso.api.query_params import LIMIT, PAGE
from iaso.models import Entity, Instance, OrgUnit, FormVersion
from iaso.utils.jsonlogic import jsonlogic_to_q


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = LIMIT
    page_query_param = PAGE
    max_page_size = 1000


def filter_queryset_for_mobile_entity(queryset, request):
    limit_date = request.query_params.get("limit_date", None)
    if limit_date:
        try:
            queryset = queryset.filter(instances__updated_at__gte=limit_date)
        except ValidationError:
            raise Http404("Invalid Limit Date")

    json_content = request.query_params.get("json_content", None)
    if json_content:
        try:
            q = jsonlogic_to_q(jsonlogic=json.loads(json_content), field_prefix="attributes__json__")  # type: ignore
            queryset = queryset.filter(q)
        except ValidationError:
            raise Http404("Invalid Json Content")

    p = Prefetch(
        "instances",
        queryset=Instance.objects.filter(deleted=False).exclude(file=""),
        to_attr="non_deleted_instances",
    )
    queryset = queryset.prefetch_related(p).prefetch_related("non_deleted_instances__form")

    return queryset


class MobileEntityAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = ["id", "form_id", "form_version_id", "created_at", "updated_at", "org_unit_id", "json"]

    form_id = serializers.IntegerField(read_only=True, source="form.id")
    id = serializers.CharField(read_only=True, source="uuid")
    org_unit_id = serializers.CharField(read_only=True, source="org_unit.id")
    form_version_id = serializers.SerializerMethodField()

    created_at = TimestampField()
    updated_at = TimestampField()

    @staticmethod
    def get_form_version_id(obj: Instance):
        return FormVersion.objects.get(version_id=obj.json.get("_version"), form_id=obj.form.id).id  # type: ignore


class MobileEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "created_at",
            "updated_at",
            "defining_instance_id",
            "entity_type_id",
            "instances",
        ]

    created_at = TimestampField()
    updated_at = TimestampField()

    instances = serializers.SerializerMethodField()
    id = serializers.CharField(read_only=True, source="uuid")
    defining_instance_id = serializers.CharField(read_only=True, source="attributes.uuid")
    entity_type_id = serializers.CharField(read_only=True, source="entity_type.id")

    @staticmethod
    def get_instances(entity: Entity):
        return MobileEntityAttributesSerializer(entity.non_deleted_instances, many=True).data  # type: ignore

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class MobileEntityViewSet(ModelViewSet):
    f"""Entity API for mobile

    list: /api/mobile/entities

    pagination by default: 1000 entities

    It's possible to filter out entities with no activity before a certain date with the parameter limit_date

    details = /api/mobile/entities/uuid

    sample usage: /api/mobile/entities/?limit_date=2022-12-29&{LIMIT}=1&{PAGE}=1

    """

    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]
    pagination_class = LargeResultsSetPagination
    lookup_field = "uuid"

    def get_serializer_class(self):
        return MobileEntitySerializer

    def get_queryset(self):
        profile = self.request.user.iaso_profile

        # This function alter the queryset by adding non_deleted_instances
        queryset = filter_queryset_for_mobile_entity(Entity.objects.filter(account=profile.account), self.request)

        # we give all entities having an instance linked to the one of the org units allowed for the current user
        orgunits = OrgUnit.objects.hierarchy(profile.org_units.all())
        if orgunits:
            queryset = queryset.filter(instances__org_unit__in=orgunits)

        return queryset
