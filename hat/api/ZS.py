import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import ZS
from django.core.serializers import serialize
from hat.users.models import Profile


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

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        province_ids = request.GET.get("province_id", None)
        as_geo_json = request.GET.get("geojson", None)

        queryset = ZS.objects.all()
        if not request.user.profile.province_scope.count() == 0:
            queryset = queryset.filter(province_id__in=request.user.profile.province_scope.all().values_list('pk', flat=True))
        if not request.user.profile.ZS_scope.count() == 0:
            queryset = queryset.filter(id__in=request.user.profile.ZS_scope.all().values_list('pk', flat=True))
        if province_ids:
            queryset=queryset.filter(province_id__in=province_ids.split(','))

        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False)
            serialized_zs = serialize('geojson', queryset, geometry_field='simplified_geom',
                                      fields=('name', 'pk', 'province'))
            return Response(json.loads(serialized_zs))
        else:
            return Response(queryset.values('name', 'id', 'province_id').order_by('name'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        isAuthorized = request.user.profile.ZS_scope.count() == 0
        if zs.id in request.user.profile.ZS_scope.all().values_list('pk', flat=True):
            isAuthorized = True

        if isAuthorized:
            return Response(zs.as_dict())
        else:
            return Response('Unauthorized', status=401)
