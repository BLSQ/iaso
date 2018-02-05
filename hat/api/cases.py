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
        unmatched = request.GET.get("located", None)
        queryset = Case.objects.all()
        if unmatched is not None:
            queryset = queryset.filter(normalized_village=None)
        result = map(lambda case: case.as_dict(), queryset[:10])
        return Response(result)


    def retrieve(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        return Response(case.as_dict())


