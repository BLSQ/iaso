from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
from hat.geo.models import Village


class PlanningViewSet(viewsets.ViewSet):
    """
    Planning API to allow modifications and retrieval of computed plannings.
    """

    def list(self, request):
        return Response(Planning.objects.all().values_list('name', 'id'))

    def retrieve(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        return Response(planning.as_dict())

    def update(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)
        Assignation.objects.filter(planning=planning).delete()

        for obj in request.data:
            assignation = Assignation()
            assignation.planning = planning
            assignation.village_id = obj['village']
            assignation.team_id = obj['team']
            assignation.save()

        return Response(planning.as_dict())

    def partial_update(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        for obj in request.data:
            Assignation.objects.filter(planning=planning, village_id=obj['village']).delete()
            assignation = Assignation.objects.get_or_create(planning=planning,
                                                            village_id=obj['village'],
                                                            team_id = obj['team'] )
        return Response(planning.as_dict())
