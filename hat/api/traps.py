from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
from hat.geo.models import Village
from hat.vector.models import Site
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class TrapsViewSet(viewsets.ViewSet):
    """
    Team API to allow modifications and retrieval of teams.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Site.objects.all()
        if from_date is not None:
            queryset = queryset.filter(first_survey_date__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(first_survey_date__date__lte=to_date)


        return Response(queryset.values('id', 'latitude', 'longitude'))

    def retrieve(self, request, pk=None):
        site = get_object_or_404(Site, pk=pk)

        return Response(site.as_dict())


