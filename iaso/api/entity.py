from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.models import Entity, Instance, EntityType, Form, Account

from django.http import JsonResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.request import Request
from rest_framework import serializers


class EntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = "__all__"


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = "__all__"
        read_only_fields = ("account",)


# To define
class HasEntityPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True


class EntityTypeViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntityTypeSerializer

    def get_queryset(self):
        return EntityType.objects.filter()


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


class EntityViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        return Entity.objects.filter(account=self.request.user.iaso_profile.account)

    def create(self, request, *args, **kwargs):
        data = request.data
        entity_type = get_object_or_404(EntityType, pk=data["entity_type"])
        instance = get_object_or_404(Instance, pk=data["attributes"])
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
                instance = get_object_or_404(Instance, pk=entity["attributes"])
                # Avoid duplicates
                if Entity.objects.filter(attributes=instance):
                    raise serializers.ValidationError(
                        {"attributes": "Entity with the attribute '{0}' already exists.".format(entity["attributes"])}
                    )
                entity_type = get_object_or_404(EntityType, pk=entity["entity_type"])
                account = request.user.iaso_profile.account
                Entity.objects.create(name=entity["name"], entity_type=entity_type, attributes=instance, account=account)
                created_entities.append(entity)
            return JsonResponse(created_entities, safe=False)
        entities = Entity.objects.filter(account=request.user.iaso_profile.account)
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)
