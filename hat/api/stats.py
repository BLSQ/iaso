from django.db.models import Count
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.api.coordination import is_user_coordination_authorized
from hat.cases.models import CaseView
from hat.geo.models import Village
from hat.users.models import get_user_geo_list, Coordination
from .authentication import CsrfExemptSessionAuthentication


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
        zs_id = request.GET.get("zs_id", None)
        as_id = request.GET.get("as_id", None)
        coordination_id = request.GET.get("coordination_id", None)
        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            if not is_user_coordination_authorized(coordination, request.user):
                return Response('Unauthorized', status=401)

        cases = CaseView.objects.filter(normalized_date__gte=from_date, normalized_date__lte=to_date)

        if coordination_id:
            cases = cases.filter(normalized_team__coordination__id=coordination_id)
        if request.user.profile.province_scope.count() != 0:
            cases = cases.filter(normalized_AS__ZS__province_id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            cases = cases.filter(normalized_AS__ZS_id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct()
        if request.user.profile.AS_scope.count() != 0:
            cases = cases.filter(normalized_AS_id__in=get_user_geo_list(request.user, 'AS_scope')).distinct()

        if province_id:
            cases = cases.filter(normalized_AS__ZS__province__id=province_id)
        if zs_id:
            cases = cases.filter(normalized_AS__ZS__id=zs_id)
        if as_id:
            cases = cases.filter(normalized_AS__id=as_id)
        if from_date:
            cases = cases.filter(normalized_date__gte=from_date)
        if to_date:
            cases = cases.filter(normalized_date__lte=to_date)

        if stat == 'screened':
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

            nr_records = cases.count()
            nr_positive_records = cases.filter(screening_result__gte=2).count()
            nr_negative_records = cases.filter(screening_result=1).count()

            res = {
                "total": nr_records,
                "negative": nr_negative_records,
                "positive": nr_positive_records,
            }
        if stat == 'confirmationsRate':
            nr_positive_screenings = cases.filter(screening_result__gte=2).count()
            nr_positive_confirmations = cases.filter(confirmed_case=True).count()

            nr_negative_confirmations = cases.filter(confirmation_result=1).count()

            res = {
                "positive_screenings": nr_positive_screenings,
                "positive_confirmations": nr_positive_confirmations,
                "negative_confirmations": nr_negative_confirmations,
            }
        return Response(res)

