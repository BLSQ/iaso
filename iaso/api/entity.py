from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import safe_api_import
from iaso.api.instances import InstancesViewSet, HasInstancePermission
from iaso.models import Entity, Instance

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework import serializers


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = '__all__'


class EntitiesViewSet(viewsets.ViewSet):

    permission_classes = [HasInstancePermission]

    def list(self, request):
        entities = Entity.objects.all()
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["POST"])
    @safe_api_import("instance")
    def create_entity(self, request, *args, **kwargs):
        print("PASSE ICI ?")

        super().create(request, *args, **kwargs)
        instance = Instance.objects.get(file=request.file)
