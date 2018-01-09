from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.geo.models import Village


class VillageViewSet(viewsets.ViewSet):
    """
    API allowing listing villages with cases info
    """

    def list(self, request):
        return Response(Village.objects.all().values('name', 'id', 'longitude', 'latitude'))
