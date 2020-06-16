from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.planning.models import Planning, Assignation
from .authentication import CsrfExemptSessionAuthentication


class PlanningViewSet(viewsets.ViewSet):
    """
    Planning API to allow modifications and retrieval of computed plannings.

    list:
    Returns the list of existing plannings

    retrieve:
    returns a given planning information
    example: /api/plannings/2/

    update:
    To totally update a planning, send a PUT request to its URL (example: /api/plannings/2/)
    with a json body containing a list of objects with village_id and team_id fields.

    Example: PUT on /api/plannings/2/ with JSON body
    [{
            "village_id": 39979,
            "team_id": 2
        },
        {
            "village_id": 39978,
            "team_id": 2
        }]

    partial_update:
    Same as update, but with a PATCH request, and it won't erase all existing assignations, just replace the one who
    conflict with the body of the request. For example, if you associate village 3 with team 3 and it was previously
    associated with team 2, this assignation to team 2 will be deleted.
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        "menupermissions.x_management_plannings",
        "menupermissions.x_management_workzones",
        "menupermissions.x_plannings_macroplanning",
        "menupermissions.x_plannings_microplanning",
        "menupermissions.x_plannings_routes",
    ]

    def list(self, request):
        orders = request.GET.get("order", "-created_at")
        with_template = request.GET.get("with_template", False)
        orders = ("-is_template," + orders).split(",")

        queryset = Planning.objects.all()
        if not with_template:
            queryset = queryset.filter(is_template=False)
            return Response(
                queryset.values(
                    "name",
                    "id",
                    "year",
                    "updated_at",
                    "is_template",
                    "years_coverage",
                    "months",
                    "month_start",
                ).order_by(*orders)
            )
        else:
            res = {
                "datas": queryset.values(
                    "name",
                    "id",
                    "year",
                    "updated_at",
                    "is_template",
                    "years_coverage",
                    "months",
                    "month_start",
                ).order_by(*orders)
            }
            if request.user.has_perm("menupermissions.x_management_plannings_template"):
                res["can_make_template"] = True
            else:
                res["can_make_template"] = False
            return Response(res)

    def retrieve(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        return Response(planning.as_dict())

    def create(self, request):
        planning_to_copy_id = request.data.get("planning_to_copy", None)
        year = request.data.get("year", None)
        name = request.data.get("name", None)
        years_coverage = request.data.get("years_coverage", None)
        months = request.data.get("months", None)  # defaults in Model
        month_start = request.data.get("month_start", 1)

        if planning_to_copy_id:
            planning = get_object_or_404(Planning, pk=planning_to_copy_id)
            planning.is_template = False
            planning.year = year
            new_planning = planning.copy(name,)
        else:
            new_planning = Planning()

        if year:
            new_planning.year = year

        if name:
            new_planning.name = name
        new_planning.years_coverage = years_coverage
        new_planning.months = months
        new_planning.month_start = month_start
        new_planning.save()
        return Response(new_planning.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            planning = Planning()
        else:
            planning = get_object_or_404(Planning, pk=pk)
        Assignation.objects.filter(planning=planning).delete()
        village_id = request.data.get("village_id", -1)
        team_id = request.data.get("team_id", -1)
        if village_id != -1 and team_id != -1:
            for obj in request.data:
                assignation = Assignation()
                assignation.planning = planning
                assignation.village_id = obj["village_id"]
                assignation.team_id = obj["team_id"]
                assignation.save()
        newYear = request.data.get("year", "")
        if newYear != "":
            planning.year = newYear  # Bonne année !
        newName = request.data.get("name", "")
        if newName != "":
            planning.name = newName
        is_template = request.data.get("is_template", False)
        newMonths = request.data.get("months", None)
        if newMonths:
            planning.months = newMonths
        newMonthStart = request.data.get("month_start", None)
        if newMonthStart:
            planning.month_start = newMonthStart

        planning.is_template = is_template

        planning.years_coverage = request.data.get("years_coverage", None)
        if is_template and not request.user.has_perm(
            "menupermissions.x_management_plannings_template"
        ):
            return Response("Unauthorized", status=401)
        else:
            planning.save()
            return Response(planning.as_dict())

    def partial_update(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)

        if planning.is_template and not request.user.has_perm(
            "menupermissions.x_management_plannings_template"
        ):
            return Response("Unauthorized", status=401)
        else:
            for obj in request.data:
                Assignation.objects.filter(
                    planning=planning, village_id=obj["village_id"]
                ).delete()
                if obj.get("team_id", "none") != "none":
                    Assignation.objects.get_or_create(
                        planning=planning,
                        village_id=obj["village_id"],
                        team_id=obj["team_id"],
                    )
            return Response(planning.as_dict())

    def delete(self, request, pk=None):
        planning = get_object_or_404(Planning, pk=pk)
        if planning.is_template and not request.user.has_perm(
            "menupermissions.x_management_plannings_template"
        ):
            return Response("Unauthorized", status=401)
        else:
            planning.delete()
            return Response(True)
