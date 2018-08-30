from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.response import Response
from hat.planning.models import WorkZone, Planning
from hat.geo.models import AS
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
        years = request.GET.get("years", "2017,2016,2015,2014,2013")


        matchings = { 'coordination_name': 'coordination_id', 'planning_name': 'planning_id' }
        prefix = ''
        if order.startswith('-'):
                    order = order[1:]
                    prefix = '-'
        qs_order = "%s%s" % (prefix, matchings.get(order, order))

        queryset = WorkZone.objects.all()

        if years:
            years_array = years.split(",")
            population_endemic_villages = Sum(
                "AS__village__population", filter=Q(AS__village__caseview__confirmed_case=True, AS__village__caseview__normalized_year__in=years_array)
            )
            queryset = queryset.annotate(population=population_endemic_villages)


        if planning_id:
            queryset = queryset.filter(planning_id=planning_id,)
        if coordination_id:
            queryset = queryset.filter(coordination_id=coordination_id,)
        queryset = queryset.order_by(qs_order)
        return Response([zone.as_dict() for zone in queryset])

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

        if name:
            work_zone.name = name
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