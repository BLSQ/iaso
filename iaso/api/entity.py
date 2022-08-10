from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.fields import DateTimeField
from rest_framework.response import Response

from iaso.api.common import TimestampField, ModelViewSet
from iaso.models import Entity, Instance, EntityType, Form, Account, entity

from django.http import JsonResponse, HttpResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.request import Request
from rest_framework import serializers


class EntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name", "created_at", "updated_at", "reference_form", "entities_count", "account"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    entities_count = serializers.SerializerMethodField()

    @staticmethod
    def get_entities_count(obj: EntityType):
        return Entity.objects.filter(entity_type=obj.id).count()


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        depth = 1
        fields = [
            "id",
            "name",
            "uuid",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "entity_type_name",
            "instances",
        ]

    entity_type_name = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_attributes(self, entity: Entity):
        if entity.attributes:
            return entity.attributes.as_full_model()
        return None

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "uuid",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "entity_type_name",
        ]

    entity_type_name = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


# To define
class HasEntityPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True


class EntityTypeViewSet(ModelViewSet):
    results_key = "types"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntityTypeSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = EntityType.objects.filter(account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class EntityFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("deletion_status", "active")

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class BeneficiaryFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("deletion_status", "active")

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class EntityViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        entity_types__id = self.request.query_params.get("entity_types__ids", None)

        order = self.request.query_params.get("order", "updated_at").split(",")
        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        if entity_types__id:
            entity_types__ids = entity_types__id.split(",")
            queryset = queryset.filter(entity_type__in=entity_types__ids)

        queryset = queryset.order_by(*order)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        entity_type = get_object_or_404(EntityType, pk=int(data["entity_type"]))
        instance = get_object_or_404(Instance, uuid=data["attributes"])
        account = request.user.iaso_profile.account
        # Avoid duplicates
        if Entity.objects.filter(attributes=instance):
            raise serializers.ValidationError({"attributes": "Entity with this attribute already exists."})

        entity = Entity.objects.create(name=data["name"], entity_type=entity_type, attributes=instance, account=account)
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    @action(detail=False, methods=["POST", "GET"])
    def bulk_create(self, request, *args, **kwargs):
        created_entities = []
        data = request.data if isinstance(request.data, list) else [request.data]
        # allows multiple create
        if request.method == "POST":
            for entity in data:
                instance = get_object_or_404(Instance, uuid=entity["attributes"])
                # Avoid duplicates
                if Entity.objects.filter(attributes=instance):
                    raise serializers.ValidationError(
                        {"attributes": "Entity with the attribute '{0}' already exists.".format(entity["attributes"])}
                    )
                entity_type = get_object_or_404(EntityType, pk=int(entity["entity_type"]))
                account = request.user.iaso_profile.account
                Entity.objects.create(
                    name=entity["name"], entity_type=entity_type, attributes=instance, account=account
                )
                created_entities.append(entity)
            return JsonResponse(created_entities, safe=False)
        entities = Entity.objects.filter(account=request.user.iaso_profile.account)
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    # def export_beneficiary_as_csv_xls(self, beneficiary, param):
    #     columns = [
    #         {"title": "First_Name", "width": 20},
    #         {"title": "Last_name", "width": 20},
    #         {"title": "Age", "width": 20},
    #         {"title": "Form", "width": 40},
    #         {"title": "Date", "width": 20},
    #         {"title": "Org_Unit", "width": 20},
    #         {"title": "Key_Information", "width": 20},
    #         {"title": "Submiter", "width": 20},
    #     ]
    #
    #     filename = "beneficiary" if int(param) else "beneficiaries"

    # @action(detail=False, methods=["GET"])
    # def get_beneficiary(self, request, *args, **kwargs):
    #     pk = request.GET.get("id", None)
    #     beneficiary = get_object_or_404(Entity, pk=pk, entity_type__name="beneficiary")
    #     serializer = BeneficiarySerializer(beneficiary, many=False)
    #     return Response(serializer.data)
    #
    # @action(detail=False, methods=["GET"])
    # def beneficiaries(self, request, *args, **kwargs):
    #     limit = request.GET.get("limit", None)
    #     page_offset = request.GET.get("page", 1)
    #     orders = request.GET.get("order", "updated_at").split(",")
    #     csv_format = request.GET.get("csv", None)
    #     xlsx_format = request.GET.get("xlsx", None)
    #
    #     beneficiaries = Entity.objects.filter(
    #         entity_type__name="beneficiary", account=request.user.iaso_profile.account
    #     )
    #
    #     if limit:
    #         limit = int(limit)
    #         page_offset = int(page_offset)
    #         paginator = Paginator(beneficiaries, limit)
    #         res = {"count": paginator.count}
    #         if page_offset > paginator.num_pages:
    #             page_offset = paginator.num_pages
    #         page = paginator.page(page_offset)
    #
    #         serializer = BeneficiarySerializer(beneficiaries, many=True)
    #
    #         def as_dict_formatter(x):
    #             dict = x.as_dict()
    #             dict["beneficiaries"] = serializer.data
    #             return dict
    #
    #         res["beneficiaries"] = map(as_dict_formatter, page.object_list)
    #         res["has_next"] = page.has_next()
    #         res["has_previous"] = page.has_previous()
    #         res["page"] = page_offset
    #         res["pages"] = paginator.num_pages
    #         res["limit"] = limit
    #         return Response(res)
    #
    #     serializer = BeneficiarySerializer(beneficiaries, many=True)
    #     return Response(serializer.data)


class BeneficiaryViewset(ModelViewSet):
    results_key = "beneficiary"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return BeneficiarySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        order = self.request.query_params.get("order", "updated_at").split(",")

        queryset = Entity.objects.filter(
            account=self.request.user.iaso_profile.account, entity_type__name="beneficiary"
        )
        if search:
            # TODO: extend search to attributes uuid, form name, ...
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.order_by(*order)
        return queryset
