from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
from hat.geo.models import Village
from rest_framework import generics
from rest_framework import serializers


class AssignationViewSet(viewsets.ViewSet):
    """
    Given a team_id and a planning_id, returns a list of villages assigned to that team in that planning.
    Example: /api/assignations/?team_id=2&planning_id=2
    """

    def list(self, request):
        planning_id = request.GET.get('planning_id', None)
        coordination_id = request.GET.get('coordination_id', None)

        assignations = Assignation.objects
        if coordination_id:
            teams = Team.objects.filter(coordination_id=coordination_id)
            assignations = assignations.filter(team__in=teams)
        assignations = assignations.filter(planning_id=planning_id).select_related('village__AS').order_by('-team__UM', '-team__capacity', 'team__id',  'village__name')

        res = []
        for assignation in assignations:
            res.append(assignation.as_dict())

        return Response(res)


