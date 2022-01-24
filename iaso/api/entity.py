from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import safe_api_import
from iaso.api.instances import InstancesViewSet, HasInstancePermission
from iaso.models import Entity, Instance, EntityType, Form

from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.request import Request
from rest_framework import serializers


class EntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = "__all__"


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ["id", "uuid", "name", "entity_type", "attributes"]


class HasEntityPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True


class EntityTypeViewSet(viewsets.ViewSet):
    # Get Queryset to be defined when we know on what it should be filtered
    def get_queryset(self, request):
        pass

    def list(self, request):
        entities_type = EntityType.objects.all()
        serializer = EntityTypeSerializer(entities_type, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        entities_type = EntityType.objects.all()
        entity_type = get_object_or_404(entities_type, pk=pk)
        serializer = EntityTypeSerializer(entity_type)
        return Response(serializer.data)

    def create(self, request):
        entities_type = Form.objects.all()
        data = request.data
        defining_form = get_object_or_404(entities_type, pk=data["defining_form"])
        entity_type = EntityType.objects.create(name=data["name"], defining_form=defining_form)

        serializer = EntityTypeSerializer(entity_type, many=False)
        return Response(serializer.data)

    def update(self, request, pk=None):
        entities_type = EntityType.objects.all()
        form_qs = Form.objects.all()
        data = request.data
        entity_type = get_object_or_404(entities_type, pk=pk)
        print(entity_type)
        form = get_object_or_404(form_qs, pk=data["defining_form"])
        print(form)

        entity_type.name = data["name"]
        entity_type.defining_form = form

        entity_type.save()

        serializer = EntityTypeSerializer(entity_type)
        return Response(serializer.data)


class EntityViewSet(viewsets.ViewSet):
    # Get Queryset to be defined when we know on what it should be filtered
    def get_queryset(self):
        pass

    def list(self, request):
        entities = Entity.objects.all()
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        entities = Entity.objects.all()
        entity = get_object_or_404(entities, pk=pk)
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    def create(self, request):
        entities = EntityType.objects.all()
        data = request.data
        entity_type = get_object_or_404(entities, pk=data["entity_type"])
        instance = get_object_or_404(Instance.objects.all(), pk=data["attributes"])

        # Avoid duplicates
        if Entity.objects.filter(attributes=instance):
            return Response({"result": "An Entity with this attribute already exists."}, status=409)

        entity = Entity.objects.create(name=data["name"], entity_type=entity_type, attributes=instance)
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    def update(self, request, pk=None):
        entities = Entity.objects.all()
        instance_qs = Instance.objects.all()
        entity = get_object_or_404(entities, pk=pk)
        entity_types = EntityType.objects.all()
        data = request.data
        instance = get_object_or_404(instance_qs, pk=data["attributes"])
        # Avoid duplicates
        try:
            existing_entity = Entity.objects.get(attributes=instance)
            if existing_entity.uuid != entity.uuid:
                return Response({"result": "An Entity with this attribute already exists."}, status=409)
        except ObjectDoesNotExist:
            pass

        entity.name = data["name"]
        entity.entity_type = get_object_or_404(entity_types, pk=data["entity_type"])
        entity.attributes = instance
        entity.save()

        serializer = EntitySerializer(entity, many=False)

        return Response(serializer.data)
