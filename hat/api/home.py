import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS
from django.db.models import Q
from django.db.models import Count


class HomeViewSet(viewsets.ViewSet):
    """
    list:
    Returns a list of ZS to build home map
        /api/zs/
        /api/zs/?years=2017,2016,2015&with_geo_json=true

    """

    authentication_classes = ([])
    permission_classes = ([])

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        as_geo_json = request.GET.get("geojson", None)
        years = request.GET.get("years", None)
        with_geo_json = request.GET.get("with_geo_json", None)

        queryset = ZS.objects.all()

        values = ['name', 'id', 'province_id']
        if with_geo_json:
            queryset = queryset.filter(geom__isnull=False)
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

