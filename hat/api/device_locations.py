from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.db.models import Q

from hat.sync.models import DeviceDB
from hat.cases.models import Case
from hat.geo.models import Village

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class DeviceVillageViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of locations of devices.

    Example usage: /api/devicevillages/394b85dce74bf3ee/?from=2017-01-01

    each village has a nr_cases filed with the number of files registered in that village by that device
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):

        queryset = DeviceDB.objects.all()
        return Response(queryset.values("id", "device_id"))

    def retrieve(self, request, pk=None):
        device = get_object_or_404(DeviceDB, device_id=pk)

        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Village.objects.all()

        case_filter = Q(caseview__device_id=device.device_id)

        if from_date is not None:
            case_filter = case_filter & Q(caseview__normalized_date__gte=from_date)
        if to_date is not None:
            case_filter = case_filter & Q(caseview__normalized_date__lte=to_date)

        queryset = queryset.annotate(nr_cases=Count("caseview", filter=case_filter)).filter(nr_cases__gte=1)

        values = ("name", "id", "longitude", "latitude", "population", "AS_id", "AS__name")
        values = values + ("AS__ZS__name", "AS__ZS__id", "AS__ZS__province__name", "AS__ZS__province__id", "nr_cases")

        return Response(queryset.values(*values))
