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
        team_id = request.GET.get('team_id', None)

        assignations =  Assignation.objects.filter(team_id=team_id, planning_id=planning_id).order_by(
            "village__name").select_related('village__AS')
        res = []
        for assignation in assignations:
            res.append(assignation.as_dict())

        return Response(res)


