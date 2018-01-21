from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
from hat.geo.models import Village

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class TeamViewSet(viewsets.ViewSet):
    """
    Team API to allow modifications and retrieval of teams.

    list:
    Returns the list of existing teams

    retrieve:
    returns a given team information
    example: /api/teams/2/

    update:
    To totally update a team, send a PUT request to its URL (example: /api/teams/2/).

    Example: PUT on /api/teams/2/ with JSON body
    {
        "planning_id": 2,
        "assignations":[
    {
            "village_id": 39979

        },
        {
            "village_id": 39978
        }]
        }

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        coordination_id = request.GET.get("coordination_id", None)

        queryset = Team.objects.all()
        if coordination_id:
            queryset = queryset.filter(coordination_id=coordination_id)

        return Response(queryset.values('name', 'id').order_by('name'))

    def retrieve(self, request, pk=None):
        team = get_object_or_404(Team, pk=pk)

        return Response(team.as_dict())

    def update(self, request, pk=None):
        team = get_object_or_404(Team, pk=pk)
        planning = get_object_or_404(Planning, pk=request.data.get('planning_id', -1))

        Assignation.objects.filter(team=team, planning=planning).delete()

        for obj in request.data['assignations']:
            Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
            assignation = Assignation()
            assignation.planning = planning
            assignation.village_id = obj['village_id']
            assignation.team = team
            assignation.save()

        return Response(team.as_dict())

