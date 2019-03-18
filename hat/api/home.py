import json

from django.views.decorators.cache import cache_control
from rest_framework import viewsets
from rest_framework.response import Response

from hat.geo.geojson import geojson_queryset
from hat.geo.models import ZS
from django.db.models import Q
from django.db.models import Count
from hat.cases.models import RES_POSITIVE
from hat.constants import TYPES_CONFIRMATION
from hat.patient.models import Test
from django.core.cache import cache

cacheValue = 60 * 60 * 24 * 7

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
                cache.set(absolute_url, geo_json, cacheValue)
                return Response(geo_json)
            else:
                cache.set(absolute_url, queryset.values(*values).order_by('name'), cacheValue)
                return Response(queryset.values(*values).order_by('name'))
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

            cache.set(absolute_url, grouped_queryset, cacheValue)
            return Response(grouped_queryset)

