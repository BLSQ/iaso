from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.planning.models import Planning, Assignation
from hat.users.models import Coordination
from hat.cases.models import Case
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class CasesViewSet(viewsets.ViewSet):
    """
    Api to list all cases,  retrieve information about just one.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):

        queryset = Case.objects.filter(normalized_village=None, normalized_village_not_found=False, confirmed_case=True)\
            .exclude(source='mobile_sync').exclude(source='mobile_backup').exclude(document_date__year__lte=2012)\
            .exclude(province__icontains='kas').exclude(province__icontains='kinsh').exclude(province__icontains='bas')\
            .exclude(province__icontains='maniema').exclude(province__icontains='k.').exclude(province__icontains='equateur')


        remaining_count = queryset.count()
        res = {'remaining_count': remaining_count}
        if remaining_count > 0:
            kase = queryset[0].as_dict()
            res['case'] = kase
        else:
            res['case'] = None

        return Response(res)

    def retrieve(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        return Response(case.as_dict())

    def partial_update(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        village_id = request.data.get('village_id', None)
        not_found = request.data.get('not_found', None)

        if village_id:
            case.normalized_village_not_found = False
            case.normalized_village_id = village_id
            case.save()
        elif not_found:
            case.normalized_village_not_found = True
            case.normalized_village_id = None
            case.save()

        return Response(case.as_dict())
