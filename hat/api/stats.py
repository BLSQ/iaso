from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.cases.models import CaseView
from hat.geo.models import Village
from django.db.models import Sum

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class StatsViewSet(viewsets.ViewSet):
    """
    Stats API to allow modifications and retrieval of teams.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_stats_graphs',
    ]

    def list(self, request):
        stat = request.GET.get("stat", 'screened')
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)

        if stat == 'screened':
            cases = CaseView.objects.filter(normalized_date__gte=from_date, normalized_date__lte=to_date)
            if from_date:
                cases = cases.filter(normalized_date__gte=from_date)
            if to_date:
                cases = cases.filter(normalized_date__lte=to_date)

            village_ids = cases.values('normalized_village_id').distinct('normalized_village_id')

            population_result = Village.objects.filter(id__in=village_ids).aggregate(total=Sum('population'))
            estimated_population = population_result['total']
            screening_count = cases.count()
            res = {
                "estimated_village_population": estimated_population,
                "screening_count": screening_count,
                "total_visited": village_ids.count(),
                "visited_with_population": Village.objects.filter(id__in=village_ids, population__isnull=False).count()
            }
        return Response(res)

