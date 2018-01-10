from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import AS


class ASViewSet(viewsets.ViewSet):
    """
    list:
    Returns a list of AS, that can be filtered by providing a zs_id
        /api/as/
        /api/as/?zs_id=2

    retrieve:
    It is also possible to get additional information on a given AS by providing directly its id
        /api/as/2


    """
    def list(self, request):
        zs_id = request.GET.get("zs_id", None)
        queryset = AS.objects.all()
        if zs_id:
            queryset=queryset.filter(ZS_id=zs_id)
        return Response(queryset.values('name', 'id'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(AS, pk=pk)
        return Response(zs.as_dict())
