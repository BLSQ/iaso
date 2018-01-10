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
        planning_id = request.GET.get("planning_id", None)
        province_id = request.GET.get("province_id", None)
        zs_id = request.GET.get("zs_id", None)
        as_id = request.GET.get("as_id", None)

        queryset = Village.objects.all()

        if province_id:
            queryset = queryset.filter(AS__ZS__province_id=province_id)
        if zs_id:
            queryset = queryset.filter(AS__ZS_id=zs_id)
        if as_id:
            queryset = queryset.filter(AS_id=as_id)

        if planning_id:
            nr_positive_cases = Count('case', filter=Q(case__confirmed_case=True))
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ('nr_positive_cases', )

        print(queryset.query)

        res = queryset.values(*values )

        return Response(res)
