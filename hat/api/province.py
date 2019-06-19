from django.views.decorators.cache import cache_control
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.geo.geojson import geojson_queryset
from hat.geo.models import Province
from hat.users.models import get_user_geo_list


class ProvinceViewSet(viewsets.ViewSet):
    """
    Api to list all provinces, or retrieve information about just one.
    """

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        as_geo_json = request.GET.get("geojson", None)
        provinces = Province.objects.all()
        if request.user.profile.province_scope.count() != 0:
            provinces = provinces.filter(id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if as_geo_json:
            geo_json = geojson_queryset(provinces, geometry_field='simplified_geom', fields=['name'])
            return Response(geo_json)
        else:
            return Response(provinces.values('name', 'old_name', 'id').order_by('name'))

    def retrieve(self, request, pk=None):
        province = get_object_or_404(Province, pk=pk)
        is_authorized = request.user.profile.province_scope.count() == 0
        if province.id in get_user_geo_list(request.user, 'province_scope'):
            is_authorized = True

        if is_authorized:
            return Response(province.as_dict())
        else:
            return Response('Unauthorized', status=status.HTTP_401_UNAUTHORIZED)
