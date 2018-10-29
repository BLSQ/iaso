import json
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import ZS
from django.core.serializers import serialize


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

    permission_required = [
        'menupermissions.x_management_coordinations',
        'menupermissions.x_management_users',
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_locator',
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        province_ids = request.GET.get("province_id", None)
        coordination_id = request.GET.get("coordination_id", None)
        as_geo_json = request.GET.get("geojson", None)

        queryset = ZS.objects.all()
        if province_ids:
            queryset=queryset.filter(province_id__in=province_ids.split(','))

        # if coordination_id:
        #     coordination = get_object_or_404(Coordination, id=coordination_id)
        #     queryset = queryset.filter(id__in=coordination.ZS.all())

        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False);
            serialized_zs = serialize('geojson', queryset, geometry_field='simplified_geom',
                                      fields=('name', 'pk', 'province'))
            return Response(json.loads(serialized_zs))
        else:
            return Response(queryset.values('name', 'id', 'province_id').order_by('name'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        return Response(zs.as_dict())
