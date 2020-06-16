from collections import defaultdict

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.api.coordination import is_user_coordination_authorized
from hat.geo.models import AS, Village
from hat.planning.algo import optimize_path
from hat.planning.models import WorkZone, Planning, Assignation
from hat.users.models import Team, Coordination
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from ..planning.services import reassign_planning


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
        "menupermissions.x_management_workzones",
        "menupermissions.x_plannings_macroplanning",
    ]

    def list(self, request):
        order = request.GET.get("order", "name")
        planning_id = request.GET.get("planning_id", None)
        coordination_id = request.GET.get("coordination_id", None)
        years = request.GET.get("years", None)
        with_areas = request.GET.get("with_areas", "True").lower() == "true"
        additional_fields = []

        matchings = {
            "coordination_name": "coordination_id",
            "planning_name": "planning_id",
        }
        prefix = ""
        if order.startswith("-"):
            order = order[1:]
            prefix = "-"
        qs_order = "%s%s" % (prefix, matchings.get(order, order))

        queryset = (
            WorkZone.objects.all()
            .prefetch_related("AS__ZS__province")
            .prefetch_related("teams")
        )
        queryset = queryset.filter(planning__is_template=False)

        if planning_id:
            queryset = queryset.filter(planning_id=planning_id)
        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            if not is_user_coordination_authorized(coordination, request.user):
                return Response("Unauthorized", status=401)
            queryset = queryset.filter(coordination_id=coordination_id)

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(
                AS__ZS__province_id__in=get_user_geo_list(
                    request.user, "province_scope"
                )
            ).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(
                AS__ZS__id__in=get_user_geo_list(request.user, "ZS_scope")
            ).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(
                AS__id__in=get_user_geo_list(request.user, "AS_scope")
            ).distinct()

        queryset = queryset.annotate(population_sum=Sum("AS__village__population"))
        additional_fields.append("population_sum")

        workzones = list(queryset.order_by(qs_order))

        if years:
            years_array = years.split(",")
            wz_areas = AS.objects.filter(workzone__in=queryset).distinct("id")
            endemic_villages_ids = (
                Village.objects.filter(AS__in=wz_areas)
                .filter(
                    caseview__confirmed_case=True,
                    caseview__normalized_year__in=years_array,
                )
                .values("id")
            )
            endemic_wz_populations = (
                Village.objects.filter(AS__in=wz_areas)
                .filter(id__in=endemic_villages_ids)
                .values("AS__workzone__id")
                .annotate(endemic_population=Sum("population"))
            )

            additional_fields.append("population_endemic_villages")
            pop_dict = {
                obj["AS__workzone__id"]: obj["endemic_population"]
                for obj in endemic_wz_populations
            }
            for workzone in workzones:
                workzone.population_endemic_villages = pop_dict.get(workzone.id, 0)

        result = [
            workzone.as_dict(with_areas, additional_fields) for workzone in workzones
        ]
        return Response(result)

    def retrieve(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        is_authorized = is_authorized = work_zone.AS.count() == 0
        for area in work_zone.AS.all():
            is_authorized = is_authorized_user(
                request.user, area.ZS.province.id, area.ZS.id, area.id
            )
        if is_authorized:
            return Response(work_zone.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        name = request.data.get("name", None)
        planning_id = request.data.get("planning", None)
        coordination_id = request.data.get("coordination", None)
        teams_ids = request.data.get("teams", None)
        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            if not is_user_coordination_authorized(coordination, request.user):
                return Response("Unauthorized", status=401)
        work_zone = WorkZone()
        work_zone.name = name
        work_zone.planning_id = planning_id
        work_zone.coordination_id = coordination_id
        work_zone.save()
        if teams_ids:
            for team_id in teams_ids:
                other_work_zones = WorkZone.objects.filter(
                    teams__id=team_id, planning_id=work_zone.planning_id
                )
                for wz in other_work_zones:
                    wz.teams.remove(team_id)  # this should never loop more than once
                work_zone.teams.add(team_id)

        return Response(work_zone.as_dict())

    def delete(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        is_authorized = work_zone.AS.count() == 0
        for area in work_zone.AS.all():
            is_authorized = is_authorized_user(
                request.user, area.ZS.province.id, area.ZS.id, area.id
            )
        if is_authorized:
            work_zone.delete()
            return Response("ok")
        else:
            return Response("Unauthorized", status=401)

    def partial_update(self, request, pk):
        work_zone = get_object_or_404(WorkZone, id=pk)
        action = request.data.get("action", None)
        zones = request.data.get("zs", [])
        areas = request.data.get("as", [])
        teams = request.data.get("teams", [])
        name = request.data.get("name", None)
        color = request.data.get("color", None)

        is_authorized = work_zone.AS.count() == 0
        for area in work_zone.AS.all():
            is_authorized = is_authorized_user(
                request.user, area.ZS.province.id, area.ZS.id, area.id
            )
        if not is_authorized:
            return Response("Unauthorized", status=401)
        areas = set(areas)
        if zones:
            zone_areas_ids = [
                t[0] for t in AS.objects.filter(ZS__in=zones).values_list("id")
            ]
            areas = areas.union(zone_areas_ids)

        for area_id in areas:
            user_as_ids = get_user_geo_list(request.user, "AS_scope")
            if len(user_as_ids) == 0 or area_id in user_as_ids:
                if action == "add":
                    other_work_zones = WorkZone.objects.filter(
                        AS__id=area_id, planning_id=work_zone.planning_id
                    )
                    for wz in other_work_zones:
                        wz.AS.remove(area_id)  # this should never loop more than once
                    work_zone.AS.add(area_id)

                elif action == "delete":
                    work_zone.AS.remove(area_id)

        if teams:
            for team_id in teams:
                if action == "add":
                    other_work_zones = WorkZone.objects.filter(
                        teams__id=team_id, planning_id=work_zone.planning_id
                    )
                    for wz in other_work_zones:
                        wz.teams.remove(
                            team_id
                        )  # this should never loop more than once
                    work_zone.teams.add(team_id)

                elif action == "delete":
                    work_zone.teams.remove(team_id)

        assignations = request.data.get("assignations", -1)
        if assignations != -1:
            pk = request.data.get("planning_id", -1)

            planning = get_object_or_404(Planning, pk=pk)
            Assignation.objects.filter(
                team__workzone=work_zone, planning=planning
            ).delete()

            assignations = request.data["assignations"]

            teams_dict = defaultdict(list)
            for a in assignations:
                teams_dict[a["team_id"]].append(a)

            if -1 in teams_dict:
                del teams_dict[-1]

            for team_id in teams_dict:
                assignation_list = teams_dict[team_id]
                ordered = optimize_path(assignation_list, work_zone.planning.months)
                reassign_planning(ordered, planning)
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
        teams = request.data.get("teams", None)

        work_zone.name = request.data.get("name", "")
        planning_id = request.data.get("planning_id", "")
        coordination_id = request.data.get("coordination_id", "")
        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            if not is_user_coordination_authorized(coordination, request.user):
                return Response("Unauthorized", status=401)

        new_planning = get_object_or_404(Planning, pk=planning_id)
        work_zone.planning = new_planning

        new_coordination = get_object_or_404(Coordination, pk=coordination_id)
        work_zone.coordination = new_coordination

        if teams:
            if pk == "0":
                work_zone.save()
            work_zone.teams.clear()
            for team in teams:
                new_team = get_object_or_404(Team, pk=team["id"])
                work_zone.teams.add(new_team)
        work_zone.save()

        return Response(work_zone.as_dict())
