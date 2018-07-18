from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from hat.planning.models import WorkZone
from hat.geo.models import AS
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

    GET /api/workzones/2/
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

    def list(self, request):

        planning_id = request.GET.get("planning_id", None)
        coordination_id = request.GET.get("coordination_id", None)

        queryset = WorkZone.objects.filter(planning_id=planning_id, coordination_id=coordination_id)

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
                other_work_zones = WorkZone.objects.filter(team__id=team_id, planning_id=work_zone.planning_id)
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
                    other_work_zones = WorkZone.objects.filter(team__id=team_id, planning_id=work_zone.planning_id)
                    for wz in other_work_zones:
                        wz.teams.remove(team_id)  # this should never loop more than once
                    work_zone.teams.add(team_id)

                elif action == "delete":
                    work_zone.teams.remove(team_id)

        if name:
            work_zone.name = name
            work_zone.save()

        return Response(work_zone.as_dict())
