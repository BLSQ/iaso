from collections import defaultdict
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db.models import Sum
from hat.planning.algo import optimize_path
from rest_framework import viewsets
from rest_framework.response import Response
from hat.planning.models import WorkZone, Planning, Assignation
from hat.geo.models import AS, Village
from hat.cases.models import CaseView
from hat.users.models import Team, Coordination
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class WorkZoneViewSet(viewsets.ViewSet):
    """
    API to manage work zones
    Examples:

    POST /api/workzones/ with the following body
    {
      "name":"twilight zone",
      "planning": 1,
      "coordination": 1
    }

    GET /api/workzones/
    GET /api/workzones/2/
    GET /api/workzones/?coordination_id=1
    GET /api/workzones/?planning_id=1
    GET /api/workzones/?planning_id=1&coordination_id=1

    PATCH /api/workzones/2/ with the following body
    {
      "action": "add",
      "zs": [715],
      "as": [12522],
      "teams": [1]
    }
    All fields are optional. If you don't set an action, zs, as and teams won't be changed.

    The other possible action is "delete" who does the obvious thing.

    PATCH /api/workzones/2/ with the following body
    {
      "name": "truc",
    }

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_management_workzones',
        'menupermissions.x_plannings_macroplanning'
    ]

    def list(self, request):
        order = request.GET.get("order", 'name')
        planning_id = request.GET.get("planning_id", None)
        coordination_id = request.GET.get("coordination_id", None)
        years = request.GET.get("years", None)

        matchings = { 'coordination_name': 'coordination_id', 'planning_name': 'planning_id' }
        prefix = ''
        if order.startswith('-'):
                    order = order[1:]
                    prefix = '-'
        qs_order = "%s%s" % (prefix, matchings.get(order, order))

        queryset = WorkZone.objects.all()

        if planning_id:
            queryset = queryset.filter(planning_id=planning_id,)
        if coordination_id:
            queryset = queryset.filter(coordination_id=coordination_id,)
        zones = list(queryset.order_by(qs_order))

        if years:
            years_array = years.split(",")
            wz_areas = AS.objects.filter(workzone__in=queryset).distinct('id')
            endemic_villages_ids = Village.objects.filter(AS__in=wz_areas).filter(caseview__confirmed_case=True,
                                                                               caseview__normalized_year__in=years_array).values(
                'id')
            endemic_wz_populations = Village.objects.filter(AS__in=wz_areas).filter(id__in=endemic_villages_ids).values(
                'AS__workzone__id').annotate(endemic_population=Sum('population'))

            pop_dict = {obj["AS__workzone__id"]: obj["endemic_population"] for obj in endemic_wz_populations}
            for zone in zones:
                zone.population_endemic_villages = pop_dict.get(zone.id, 0)

        return Response([zone.as_dict() for zone in zones])

    def retrieve(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        return Response(work_zone.as_dict())

    def create(self, request):
        name = request.data.get("name", None)
        planning_id = request.data.get("planning", None)
        coordination_id = request.data.get("coordination", None)
        teams_ids = request.data.get("teams", None)

        work_zone = WorkZone()
        work_zone.name = name
        work_zone.planning_id = planning_id
        work_zone.coordination_id = coordination_id
        work_zone.save()
        if teams_ids:

            for team_id in teams_ids:
                other_work_zones = WorkZone.objects.filter(teams__id=team_id, planning_id=work_zone.planning_id)
                for wz in other_work_zones:
                    wz.teams.remove(team_id)  # this should never loop more than once
                work_zone.teams.add(team_id)

        return Response(work_zone.as_dict())

    def delete(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        work_zone.delete()
        return Response("ok")

    def partial_update(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        action = request.data.get("action", None)
        zones = request.data.get("zs", [])
        areas = request.data.get("as", [])
        teams = request.data.get("teams", [])
        name = request.data.get("name", None)
        color = request.data.get("color", None)

        areas = set(areas)
        if zones:
            zone_areas_ids = [t[0] for t in AS.objects.filter(ZS__in=zones).values_list("id")]
            areas = areas.union(zone_areas_ids)

        for area_id in areas:
            if action == "add":
                other_work_zones = WorkZone.objects.filter(AS__id=area_id, planning_id=work_zone.planning_id)
                for wz in other_work_zones:
                    wz.AS.remove(area_id)  # this should never loop more than once
                work_zone.AS.add(area_id)

            elif action == "delete":
                work_zone.AS.remove(area_id)

        if teams:
            for team_id in teams:
                if action == "add":
                    other_work_zones = WorkZone.objects.filter(teams__id=team_id, planning_id=work_zone.planning_id)
                    for wz in other_work_zones:
                        wz.teams.remove(team_id)  # this should never loop more than once
                    work_zone.teams.add(team_id)

                elif action == "delete":
                    work_zone.teams.remove(team_id)

        assignations = request.data.get('assignations', -1)
        if assignations != -1:
            pk = request.data.get('planning_id', -1)

            planning = get_object_or_404(Planning, pk=pk)
            Assignation.objects.filter(team__workzone=work_zone, planning=planning).delete()

            assignations = request.data['assignations']

            teams_dict = defaultdict(list)
            for a in assignations:
                teams_dict[a['team_id']].append(a)

            if -1 in teams_dict:
                del teams_dict[-1]

            for team_id in teams_dict:
                assignation_list = teams_dict[team_id]
                ordered = optimize_path(assignation_list)
                for index, obj in enumerate(ordered):
                    Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
                    assignation = Assignation()
                    assignation.planning = planning
                    assignation.index = obj['index']
                    assignation.month = obj['month']
                    assignation.village_id = obj['village_id']
                    assignation.team_id = obj['team_id']
                    assignation.save()
        if name:
            work_zone.name = name
            work_zone.save()

        if color:
            work_zone.color = color
            work_zone.save()

        return Response(work_zone.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            work_zone = WorkZone()
        else:
            work_zone = get_object_or_404(WorkZone, id=pk)
        teams = request.data.get('teams', None)

        work_zone.name = request.data.get('name', '')
        planning_id = request.data.get('planning_id', '')
        coordination_id = request.data.get('coordination_id', '')

        new_planning = get_object_or_404(Planning, pk=planning_id)
        work_zone.planning = new_planning

        new_coordination = get_object_or_404(Coordination, pk=coordination_id)
        work_zone.coordination = new_coordination

        if teams:
            if pk == "0":
                work_zone.save()
            work_zone.teams.clear()
            for team in teams:
                new_team = get_object_or_404(Team, pk=team['id'])
                work_zone.teams.add(new_team)
        work_zone.save()

        return Response(work_zone.as_dict())