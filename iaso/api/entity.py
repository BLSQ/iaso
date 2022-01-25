from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.models import Entity, Instance, EntityType, Form

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


class HasEntityPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True


class EntityTypeViewSet(ModelViewSet):

    results_key = "entities"
    remove_results_key_if_paginated = True
    # Check if filters are needed
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntityTypeSerializer

    def get_queryset(self):
        return EntityType.objects.filter()

    @action(methods=["GET"], detail=True, serializer_class=EntityTypeSerializer)
    def retrieve_entity_type(self, request, pk=None):
        entities_type = EntityType.objects.all()
        entity_type = get_object_or_404(entities_type, pk=pk)
        serializer = EntityTypeSerializer(entity_type)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        entities_type = Form.objects.all()
        data = request.data
        defining_form = get_object_or_404(entities_type, pk=data["defining_form"])
        entity_type = EntityType.objects.create(name=data["name"], defining_form=defining_form)

        serializer = EntityTypeSerializer(entity_type, many=False)
        return Response(serializer.data)

    @action(methods=["PUT"], detail=True, serializer_class=EntityTypeSerializer)
    def update_entity_type(self, request, pk=None):
        entities_type = EntityType.objects.all()
        form_qs = Form.objects.all()
        data = request.data
        entity_type = get_object_or_404(entities_type, pk=pk)
        form = get_object_or_404(form_qs, pk=data["defining_form"])

        entity_type.name = data["name"]
        entity_type.defining_form = form

        entity_type.save()

        serializer = EntityTypeSerializer(entity_type)
        return Response(serializer.data)


class EntityFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("entity")
        # Check with team if filters are required
        pass


class EntityViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        return Entity.objects.filter()

    @action(methods=["GET"], detail=True, serializer_class=EntitySerializer)
    def retrieve_entity(self, pk=None):
        entities = Entity.objects.all()
        entity = get_object_or_404(entities, pk=pk)
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        created_entities = []
        data = request.data if isinstance(request.data, list) else [request.data]
        for entity in data:
            entity_type = get_object_or_404(EntityType, pk=entity["entity_type"])
            instance = get_object_or_404(Instance.objects.all(), pk=entity["attributes"])
            # Avoid duplicates
            if Entity.objects.filter(attributes=instance):
                return Response(
                    {"result": "Error with {0}. An Entity with this attribute already exists.".format(entity["name"])},
                    status=409,
                )
            Entity.objects.create(name=entity["name"], entity_type=entity_type, attributes=instance)
            created_entities.append(entity)
        return JsonResponse(created_entities, safe=False)

    @action(methods=["PUT"], detail=True, serializer_class=EntitySerializer)
    def update_entity(self, request, pk=None):
        entities = Entity.objects.all()
        instance_qs = Instance.objects.all()
        entity = get_object_or_404(entities, pk=pk)
        entity_types = EntityType.objects.all()
        data = request.data
        instance = get_object_or_404(instance_qs, pk=data["attributes"])
        entity.name = data["name"]
        entity.entity_type = get_object_or_404(entity_types, pk=data["entity_type"])
        entity.attributes = instance
        entity.save()

        serializer = EntitySerializer(entity, many=False)

        return Response(serializer.data)
