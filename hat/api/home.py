import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS, Province
from django.db.models import Q
from django.db.models import Count
from hat.cases.models import RES_POSITIVE
from hat.constants import TYPES_CONFIRMATION
from hat.patient.models import Test
from django.core.cache import cache

cacheTTL = 60 * 60 * 24 * 7


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
        absolute_url = request.build_absolute_uri()

        result = cache.get(absolute_url)
        if result:
            return Response(result)
        is_map = request.GET.get("map", None)
        is_chart = request.GET.get("chart", None)
        if is_map:
            as_geo_json = request.GET.get("geojson", None)
            years = request.GET.get("years", None)

            queryset = ZS.objects.all()

            values = ['name', 'id', 'province_id']
            if years:
                years_array = years.split(",")
                nr_positive_cases = Count(
                    "as", filter=Q(as__village__caseview__confirmed_case=True,
                                   as__village__caseview__normalized_year__in=years_array)
                )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values.append('nr_positive_cases')
            if as_geo_json:
                zones = queryset.filter(geom__isnull=False)
                zones_provinces_ids = zones.values('province_id').distinct('province_id')
                provinces = Province.objects.all().exclude(id__in=zones_provinces_ids).filter(geom__isnull=False)
                zones_geo_json = geojson_queryset(zones, geometry_field='simplified_geom', fields=['name', 'province'])
                provinces_geo_json = geojson_queryset(provinces, geometry_field='simplified_geom', fields=['name'])
                result = {
                    "zones": zones_geo_json,
                    "provinces": provinces_geo_json,
                }
                cache.set(absolute_url, result, cacheTTL)
                return Response(result)
            else:
                result = queryset.values(*values).order_by('name')
                cache.set(absolute_url, result, cacheTTL)
                return Response(result)
        if is_chart:
            from_date = request.GET.get("from", None)
            to_date = request.GET.get("to", None)
            queryset = Test.objects.extra(select={'date': "date_trunc('year', date) "})
            if from_date is not None:
                queryset = queryset.filter(date__gte=from_date)

            if to_date is not None:
                queryset = queryset.filter(date__lte=to_date)

            grouped_queryset = (
                    queryset
                    .values("date")
                    .annotate(positive_confirmation_test_count=Count(
                        "id",
                        filter=(Q(type__in=TYPES_CONFIRMATION) & Q(result__gte=RES_POSITIVE))))
            )

            values = ("date", "positive_confirmation_test_count")
            orders = "date",

            grouped_queryset = grouped_queryset.values(*values).order_by(*orders)

            cache.set(absolute_url, grouped_queryset, cacheTTL)
            return Response(grouped_queryset)

