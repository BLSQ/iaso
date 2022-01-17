from rest_framework import routers
from rest_framework.response import Response

from iaso.models import Entity
from .views import views

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework import serializers


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = '__all__'


class EntitiesViewSet(viewsets.ViewSet):
    def list(self, request):
        entities = Entity.objects.all()
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    def create(self, request):
        pass


router = routers.SimpleRouter()
router.register(r"wfp/entities", EntitiesViewSet, basename="Test")
