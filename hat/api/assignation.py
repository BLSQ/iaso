from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count
from django.db.models import Q
from hat.planning.models import Assignation, WorkZone
from hat.users.models import Team
from hat.geo.models import Village
from hat.patient.models import Test
from hat.planning.models import Planning


from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


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
    of the original assignation (so you just have to load that into your frontend to update)

    If you want to have the case_count per village, just add show_case_count=true to the URL params. 
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = [
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_plannings_routes'
    ]

    def list(self, request):
        planning_id = request.GET.get('planning_id', None)
        coordination_id = request.GET.get('coordination_id', None)
        workzone_id = request.GET.get('workzone_id', None)
        team_id = request.GET.get('team_id', None)
        show_case_count = request.GET.get('show_case_count', False)
        show_tests_count = request.GET.get('show_tests_count', False)

        assignations = Assignation.objects
        if coordination_id:
            teams = Team.objects.filter(coordination_id=coordination_id)
            assignations = assignations.filter(team__in=teams)

        if workzone_id:
            workzone = WorkZone.objects.get(pk=workzone_id)
            assignations = assignations.filter(team__in=workzone.teams.all()).filter(village__AS__in=workzone.AS.all())

        if team_id:
            assignations = assignations.filter(team__id=team_id)

        assignations = assignations.filter(planning_id=planning_id).select_related('village__AS').order_by('index')

        village_ids = map(lambda ass: ass.village_id, assignations)
        if show_tests_count:
            current_planning = get_object_or_404(Planning, pk=planning_id)
            tests = Test.objects.filter(village_id__in=village_ids)\
                .filter(date__year=current_planning.year)
            if team_id:
                tests = tests.filter(team_id=team_id)

        if show_case_count:
            villages = Village.objects.filter(id__in=village_ids)
            year = timezone.now().year
            years_array = range(year-5, year)
            nr_positive_cases = Count('caseview', filter=Q(caseview__confirmed_case=True,
                                                           caseview__normalized_year__in=years_array)

                                      )
            villages = villages.annotate(nr_positive_cases=nr_positive_cases)
            endemic_dict = {village.id:village.nr_positive_cases for village in villages}

        res = []
        for assignation in assignations:
            assignation_dict = assignation.as_dict()
            if show_tests_count:
                assignation_dict['tests_count'] = tests.filter(village_id=assignation_dict['village_id']).count()
            if show_case_count:
                assignation_dict['case_count'] = endemic_dict.get(assignation.village_id, None)
            res.append(assignation_dict)


        return Response(res)

    def partial_update(self, request, pk):

        assignation = get_object_or_404(Assignation, pk=pk)

        index = request.data.get('index', assignation.index)
        month = request.data.get('month', None)
        show_tests_count = request.data.get('show_tests_count', None)

        assignation.month = month

        assignation_list = Assignation.objects.filter(team=assignation.team, planning=assignation.planning).order_by('index')

        new_list = list(filter(lambda x: x.id != assignation.id, assignation_list))
        new_list.insert(index, assignation)

        for idx, a in enumerate(new_list):
            a.index = idx
            a.save()

        village_ids = map(lambda ass: ass.village_id, new_list)
        if show_tests_count:
            print (assignation.as_dict())
            current_planning = get_object_or_404(Planning, pk=assignation.planning.id)
            tests = Test.objects.all().filter(village_id__in=village_ids)\
                .filter(date__year=current_planning.year)\
                .filter(team_id=assignation.team.id)
        res = []
        for assignation in new_list:
            assignation_dict = assignation.as_dict()
            if show_tests_count:
                assignation_dict['tests_count'] = tests.filter(village_id=assignation_dict['village_id']).count()
            res.append(assignation_dict)

        return Response(res)


