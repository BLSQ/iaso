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
        team_type = request.GET.get("type", None)
        order = request.GET.get("order", None)

        queryset = Team.objects.all()
        if coordination_id:
            queryset = queryset.filter(coordination_id=coordination_id)
        if team_type:
            queryset = queryset.filter(UM=(team_type == 'UM'))

        if order is None:
            res = queryset.values('name', 'id', 'capacity').order_by('-UM', 'name')
        else:
            res = queryset.values('name', 'id', 'capacity', 'UM',
                                  'coordination_id').order_by(order)

        return Response(res)

    def retrieve(self, request, pk=None):
        team = get_object_or_404(Team, pk=pk)

        return Response(team.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            team = Team()
        else:
            team = get_object_or_404(Team, pk=pk)

        assignations = request.data.get('assignations', -1)
        if assignations != -1:
            planning = get_object_or_404(Planning, pk=request.data.get('planning_id', -1))

            Assignation.objects.filter(team=team, planning=planning).delete()

            for obj in request.data['assignations']:
                Assignation.objects.filter(
                    planning=planning, village_id=obj['village_id']).delete()
                assignation = Assignation()
                assignation.planning = planning
                assignation.village_id = obj['village_id']
                assignation.team = team
                assignation.save()
        else:
            team.name = request.data.get('name', '')
            team.capacity = request.data.get('capacity', 0)
            team.UM = request.data.get('UM', False)
            team.coordination_id = request.data.get('coordination_id', -1)
            team.save()

        return Response(team.as_dict())

    def delete(self, request, pk=None):
        team = get_object_or_404(Team, pk=pk)
        team.delete()
        return Response(True)