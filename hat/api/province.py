from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import Province
from django.core.serializers import serialize
import json
from hat.users.models import get_user_geo_list

class ProvinceViewSet(viewsets.ViewSet):
    """
    Api to list all provinces, or retrieve information about just one.
    """
    permission_required = [
        'menupermissions.x_management_users',
        'menupermissions.x_locator',
        'menupermissions.x_vectorcontrol'
    ]

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        as_geo_json = request.GET.get("geojson", None)
        provinces = Province.objects.all()
        if not request.user.profile.province_scope.count() == 0:
            provinces = provinces.filter(id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if as_geo_json:
            res = json.loads(serialize('geojson', provinces, geometry_field='simplified_geom', fields=('name', 'pk',)))
            return Response(res)
        else:
            return Response(provinces.values('name', 'old_name', 'id').order_by('name'))

    def retrieve(self, request, pk=None):
        province = get_object_or_404(Province, pk=pk)
        isAuthorized = request.user.profile.province_scope.count() == 0
        if province.id in get_user_geo_list(request.user, 'province_scope'):
            isAuthorized = True

        if isAuthorized:
            return Response(province.as_dict())
        else:
            return Response('Unauthorized', status=401)
