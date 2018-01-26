from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import ZS
from hat.users.models import Team, Coordination

class ZSViewSet(viewsets.ViewSet):
    """
    list:
    Returns a list of ZS, that can be filtered by providing a province_id
        /api/zs/
        /api/zs/?province_id=2

    retrieve:
    It is also possible to get additional information on a given ZS by providing directly its id
        /api/zs/2


    """
    def list(self, request):
        province_id = request.GET.get("province_id", None)
        coordination_id = request.GET.get("coordination_id", None)

        queryset = ZS.objects.all()
        if province_id:
            queryset=queryset.filter(province_id=province_id)

        # if coordination_id:
        #     coordination = get_object_or_404(Coordination, id=coordination_id)
        #     queryset = queryset.filter(id__in=coordination.ZS.all())

        return Response(queryset.values('name', 'id'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        return Response(zs.as_dict())
