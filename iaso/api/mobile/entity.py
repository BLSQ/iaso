from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from iaso.api.common import (
    ModelViewSet,
    DeletionFilterBackend,
    TimestampField,
)
from iaso.models import Entity, Instance, OrgUnit, FormVersion, EntityType
from iaso.utils.jsonlogic import jsonlogic_to_q


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = "page_size"
    max_page_size = 1000


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
        return list(
            map(lambda instance: MobileEntityAttributesSerializer(instance).data, entity.non_deleted_instances)
        )  # type: ignore

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class MobileEntityViewSet(ModelViewSet):
    """Entity API for mobile

    list: /api/mobile/entities

    pagination by default: 1000 entities

    It's possible to filter out entities with no activity before a certain date with the parameter limit_date

    details = /api/mobile/entities/uuid

    sample usage: /api/mobile/entity/?limit_date=2022-12-29&limit=1&page=1

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
        orgunits = OrgUnit.objects.hierarchy(profile.org_units.all())
        queryset = Entity.objects.filter(account=profile.account)
        # we give all entities having an instance linked to the one of the org units allowed for the current user
        # For now, it can be filtered on OU without any access restriction
        if orgunits:
            queryset = queryset.filter(instances__org_unit__in=orgunits)
        # we filter by last instance on the entity
        limit_date = self.request.query_params.get("limit_date", None)
        if limit_date:
            queryset = queryset.filter(instances__updated_at__gte=limit_date)
        p = Prefetch(
            "instances",
            queryset=Instance.objects.filter(deleted=False).exclude(file=""),
            to_attr="non_deleted_instances",
        )
        queryset = queryset.prefetch_related(p).prefetch_related("non_deleted_instances__form")
        return queryset


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
            queryset = queryset.filter(instances__updated_at__gte=limit_date)

        if json_content:
            q = jsonlogic_to_q(jsonlogic=json_content, field_prefix="json__")  # type: ignore
            queryset = queryset.filter(q)

        page = self.paginate_queryset(queryset)

        serializer = MobileEntitySerializer(page, many=True)

        return self.get_paginated_response(serializer.data)
