import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS, AS
from django.db.models import Q
from django.db.models import Count
from hat.users.models import get_user_geo_list


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
        years = request.GET.get("years", None)

        queryset = ZS.objects.all()
        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(province_id__in=get_user_geo_list(request.user, 'province_scope'))
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(id__in=get_user_geo_list(request.user, 'ZS_scope'))
        if request.user.profile.AS_scope.count() != 0:
            zs_from_as = AS.objects.filter(id__in=get_user_geo_list(request.user, 'AS_scope'))\
                .values_list("ZS_id", flat=True).distinct()
            queryset = queryset.filter(id__in=zs_from_as)
        if province_ids:
            queryset = queryset.filter(province_id__in=province_ids.split(','))

        values = ['name', 'id', 'province_id']
        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "as", filter=Q(as__village__caseview__confirmed_case=True, as__village__caseview__normalized_year__in=years_array)
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values.append('nr_positive_cases')

        if as_geo_json:
            queryset = queryset.filter(geom__isnull=False)
            geo_json = geojson_queryset(queryset, geometry_field='simplified_geom', fields=['name', 'province'])
            return Response(geo_json)
        else:
            return Response(queryset.values(*values).order_by('name'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        user_zs_ids = get_user_geo_list(request.user, 'ZS_scope')
        user_as_zs_ids = AS.objects.filter(id__in=get_user_geo_list(request.user, 'AS_scope'))\
            .values_list("ZS_id", flat=True).distinct()
        user_province_ids = get_user_geo_list(request.user, 'province_scope')
        is_authorized = len(user_as_zs_ids) == 0 and len(user_zs_ids) == 0 and \
            len(user_province_ids) == 0
        if not is_authorized:
            if (zs.province.id in user_province_ids) and len(user_zs_ids) == 0 and len(user_as_zs_ids) == 0:
                is_authorized = True
            if zs.id in user_zs_ids:
                is_authorized = True
            if zs.id in user_as_zs_ids:
                is_authorized = True
        if is_authorized:
            return Response(zs.as_dict())
        else:
            return Response('Unauthorized', status=401)
