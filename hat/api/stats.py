from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.cases.models import CaseView
from hat.geo.models import Village
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.db.models import Count

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
        province_id = request.GET.get("province_id", None)

        if stat == 'screened':
            cases = CaseView.objects.filter(normalized_date__gte=from_date, normalized_date__lte=to_date)
            if province_id:
                cases = cases.filter(normalized_AS__ZS__province__id=province_id)
            if from_date:
                cases = cases.filter(normalized_date__gte=from_date)
            if to_date:
                cases = cases.filter(normalized_date__lte=to_date)

            village_ids = cases.values('normalized_village_id').distinct('normalized_village_id')

            population_result = Village.objects.filter(id__in=village_ids).aggregate(total=Sum('population'))
            estimated_population = population_result['total']
            screening_count = cases.count()

            counts = cases.annotate(date=TruncDate('normalized_date')).values('date').annotate(c=Count('id')).order_by('date')

            res = {
                "estimated_village_population": estimated_population,
                "screening_count": screening_count,
                "total_visited": village_ids.count(),
                "visited_with_population": Village.objects.filter(id__in=village_ids, population__isnull=False).count(),
                "total_counts": counts
            }

        if stat == 'positiveScreeningRate':
            cases = CaseView.objects.filter(normalized_date__gte=from_date, normalized_date__lte=to_date)
            if province_id:
                cases = cases.filter(normalized_AS__ZS__province__id=province_id)
            if from_date:
                cases = cases.filter(normalized_date__gte=from_date)
            if to_date:
                cases = cases.filter(normalized_date__lte=to_date)

            nr_records = cases.count()
            nr_positive_records = cases.filter(screening_result__gte=2).count()
            nr_negative_records = cases.filter(screening_result=1).count()

            res = {
                "total": nr_records,
                "negative": nr_negative_records,
                "positive": nr_positive_records,
            }
        if stat == 'confirmationsRate':
            cases = CaseView.objects.filter(normalized_date__gte=from_date, normalized_date__lte=to_date)
            if province_id:
                cases = cases.filter(normalized_AS__ZS__province__id=province_id)
            if from_date:
                cases = cases.filter(normalized_date__gte=from_date)
            if to_date:
                cases = cases.filter(normalized_date__lte=to_date)
            nr_positive_screenings = cases.filter(screening_result__gte=2).count()
            nr_positive_confirmations = cases.filter(confirmed_case=True).count()

            nr_negative_confirmations = cases.filter(confirmed_case=False).count()

            res = {
                "positive_screenings": nr_positive_screenings,
                "positive_confirmations": nr_positive_confirmations,
                "negative_confirmations": nr_negative_confirmations,
            }
        return Response(res)

