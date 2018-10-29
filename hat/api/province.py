from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import Province
from django.core.serializers import serialize
import json

class ProvinceViewSet(viewsets.ViewSet):
    """
    Api to list all provinces, or retrieve information about just one.
    """
    permission_required = [
        'menupermissions.x_management_users',
        'menupermissions.x_locator'
    ]

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        as_geo_json = request.GET.get("geojson", None)
        provinces = Province.objects.all()
        if as_geo_json:
            res = json.loads(serialize('geojson', provinces, geometry_field='simplified_geom', fields=('name', 'pk',)))
            return Response(res)
        else:
            return Response(provinces.values('name', 'old_name', 'id').order_by('name'))

    def retrieve(self, request, pk=None):
        province = get_object_or_404(Province, pk=pk)
        return Response(province.as_dict())
