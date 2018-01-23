from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.planning.models import Planning, Assignation
from hat.users.models import Coordination
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

class CoordinationViewSet(viewsets.ViewSet):
    """
    Api to list all coordinations,  retrieve information about just one, or update the assignations for a coordination.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    
    def list(self, request):

        return Response(map(lambda x: x.as_dict(), Coordination.objects.all()))

    def retrieve(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        return Response(coordination.as_dict())

    def update(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        planning = get_object_or_404(Planning, pk=request.data.get('planning_id', -1))

        Assignation.objects.filter(team__coordination=coordination, planning=planning).delete()

        for obj in request.data['assignations']:
            Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
            assignation = Assignation()
            assignation.planning = planning
            assignation.village_id = obj['village_id']
            assignation.team_id = obj['team_id']
            assignation.save()

        return Response(coordination.as_dict())
