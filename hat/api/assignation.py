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
    OR
    Given a coordination_id and a planning_id, returns a list of villages assigned to all the team in that planning
    and coordination.
    Example: /api/assignations/?team_id=2&planning_id=2

    Edit: if you make a PATCH request to /api/assignations/assignation_id with
    the following body
    {
        "index": 1,
        "month": 3
    }
    you will be able to edit the index in the sequence of assignations or the month of the assignation.
    (The two parameters are optional)
    That request will return the list of assignations for the team of the original assignation in the planning
    of the original assignation (so you just have to load that into your fronted to update)
    """

    def list(self, request):
        planning_id = request.GET.get('planning_id', None)
        coordination_id = request.GET.get('coordination_id', None)
        team_id = request.GET.get('team_id', None)

        assignations = Assignation.objects
        if coordination_id:
            teams = Team.objects.filter(coordination_id=coordination_id)
            assignations = assignations.filter(team__in=teams)

        if team_id:
            assignations = assignations.filter(team__id=team_id)

        assignations = assignations.filter(planning_id=planning_id).select_related('village__AS').order_by('index')

        res = []
        for assignation in assignations:
            res.append(assignation.as_dict())

        return Response(res)

    def partial_update(self, request, pk):

        assignation = get_object_or_404(Assignation, pk=pk)

        index = request.data.get('index', assignation.index)
        month = request.data.get('month', assignation.month)

        assignation.month = month

        assignation_list = Assignation.objects.filter(team=assignation.team, planning=assignation.planning).order_by('index')

        new_list = list(filter(lambda x: x.id != assignation.id, assignation_list))
        new_list.insert(index, assignation)

        for idx, a in enumerate(new_list):
            a.index = idx
            a.save()

        res = []
        for assignation in new_list:
            res.append(assignation.as_dict())

        return Response(res)


