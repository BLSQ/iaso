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
    Returns:
        - a list of ZS
        - geojson of zones and provinces
        - stats on tests for the graph
        /api/zs/?from=2006-06-17&to=2018-06-17&years=2017,2016,2015
    """

    authentication_classes = ([])
    permission_classes = ([])

    @cache_control(max_age=24 * 60 * 60, public=True)
    def list(self, request):
        absolute_url = request.build_absolute_uri()

        result = cache.get(absolute_url)
        if result:
            return Response(result)

        # ZONES
        years = request.GET.get("years", None)
        years_array = years.split(",")
        AllZones = ZS.objects.all()
        values = ['name', 'id', 'province_id']
        nr_positive_cases = Count(
            "as", filter=Q(as__village__caseview__confirmed_case=True,
                            as__village__caseview__normalized_year__in=years_array)
        )
        zones = AllZones.annotate(nr_positive_cases=nr_positive_cases)
        values.append('nr_positive_cases')
        zones = zones.values(*values).order_by('name')

        # GEOJSON
        zones_geo_json = AllZones.filter(geom__isnull=False)
        zones_provinces_ids = zones_geo_json.values('province_id').distinct('province_id')
        provinces = Province.objects.all().exclude(id__in=zones_provinces_ids).filter(geom__isnull=False)
        zones_geo_json = geojson_queryset(zones_geo_json, geometry_field='simplified_geom', fields=['name', 'province'])
        provinces_geo_json = geojson_queryset(provinces, geometry_field='simplified_geom', fields=['name'])

        # CHART
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Test.objects.extra(select={'date': "date_trunc('year', date) "})
        queryset = queryset.filter(date__gte=from_date)
        queryset = queryset.filter(date__gte=from_date)
        queryset = queryset.filter(date__lte=to_date)

        chart = (
            queryset
            .values("date")
            .annotate(positive_confirmation_test_count=Count(
                "id",
                filter=(Q(type__in=TYPES_CONFIRMATION) & Q(result__gte=RES_POSITIVE))))
        )

        values = ("date", "positive_confirmation_test_count")
        orders = "date",

        chart = chart.values(*values).order_by(*orders)





        result = {
            "zones": zones,
            "geojson": {
                "zones": zones_geo_json,
                "provinces": provinces_geo_json,
            },
            "chart": chart,
        }

        cache.set(absolute_url, result, cacheTTL)
        return Response(result)



