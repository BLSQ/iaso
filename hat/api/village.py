from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.geo.models import Village
from django.db.models import Q
from django.db.models import Count


class VillageViewSet(viewsets.ViewSet):
    """
    API allowing listing villages with cases info
    """

    def list(self, request):
        values = ('name', 'id', 'longitude', 'latitude',)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        years = request.GET.get("years", None)
        types= request.GET.get("types", "YES")
        queryset = Village.objects.all()

        if province_ids:
            queryset = queryset.filter(AS__ZS__province_id__in=province_ids.split(','))
        if zs_ids:
            queryset = queryset.filter(AS__ZS_id__in=zs_ids.split(','))
        if as_ids:
            queryset = queryset.filter(AS_id__in=as_ids.split(','))

        if years:
            years_array = years.split(",")
            nr_positive_cases = Count('case', filter=Q(case__confirmed_case=True, case__document_date__year__in=years_array))
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ('nr_positive_cases', )

        if types:
            types_array = types.split(",")
            queryset = queryset.filter(village_official__in=types_array)

        res = queryset.values(*values )

        return Response(res)
