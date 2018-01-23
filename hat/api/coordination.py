from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.users.models import Coordination


class CoordinationViewSet(viewsets.ViewSet):
    """
    Api to list all coordinations, or retrieve information about just one.
    """
    def list(self, request):

        return Response(map(lambda x: x.as_dict(), Coordination.objects.all()))

    def retrieve(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        return Response(coordination.as_dict())
