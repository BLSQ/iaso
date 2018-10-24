import json
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.serializers import serialize
from django.db.models import Sum
from hat.planning.models import Planning, Assignation
from hat.geo.models import AS, ZS, Village
from hat.users.models import Coordination
from hat.planning.algo import optimize_path
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from collections import defaultdict
from hat.dashboard.views import get_last_years

class CoordinationViewSet(viewsets.ViewSet):
    """
    Api to list all coordinations,  retrieve information about just one, or update the assignations for a coordination.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_management_coordinations',
        'menupermissions.x_management_workzones',
        'menupermissions.x_management_teams',
        'menupermissions.x_plannings_macroplanning',
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_qualitycontrol'
    ]

    def list(self, request):
        order = request.GET.get("order", None)
        res = map(lambda x: x.as_dict(), Coordination.objects.all())
        if order is not None:
            reverse = order.startswith('-')

            if reverse:
                order = order[1:]

            res = sorted(res, key=lambda k: k[order], reverse=reverse)

        return Response(res)

    def retrieve(self, request, pk=None):
        as_geo_json = request.GET.get("geojson", None)
        coordination = get_object_or_404(Coordination, pk=pk)
        endemic_population = request.GET.get("endemic_population", None)
        years = request.GET.get("years", get_last_years(5))

        if as_geo_json:
            all_zs = coordination.ZS.all()
            areas = AS.objects.filter(ZS__in=all_zs)
            if endemic_population:
                as_pop_dict = {}
                years_array = years.split(",")
                endemic_villages_ids = Village.objects.filter(AS__in=areas).filter(caseview__confirmed_case=True,
                                                                                   caseview__normalized_year__in=years_array).values('id')
                endemic_as_populations = Village.objects.filter(AS__in=areas).filter(id__in=endemic_villages_ids).values('AS_id').annotate(endemic_population=Sum('population'))

                for obj in endemic_as_populations:
                    pop = obj["endemic_population"]
                    if pop is None:
                        pop = 0
                    as_pop_dict[obj["AS_id"]] = pop

            serialized_zs = serialize('geojson', all_zs, geometry_field='geom', fields=('name', 'pk',))
            serialized_as = serialize('geojson', areas, geometry_field='geom', fields=['name', 'pk', 'ZS'])
            res_dict = {
                'areas': json.loads(serialized_as),
                'zones': json.loads(serialized_zs)
            }
            if endemic_population:
                res_dict["endemic_as_populations"] = as_pop_dict
            return Response(res_dict)
        else:
            return Response(coordination.as_dict())

    def update(self, request, pk=None):
        if pk == "0":
            coordination = Coordination()
        else:
            coordination = get_object_or_404(Coordination, pk=pk)

        assignations = request.data.get('assignations', -1)
        if assignations != -1:
            planning = get_object_or_404(Planning, pk=request.data.get('planning_id', -1))
            Assignation.objects.filter(team__coordination=coordination, planning=planning).delete()

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
        else:
            coordination.name = request.data.get('name', '')
            locations = request.data.get('zs', None)
            if locations:
                if pk == "0":
                    coordination.save()
                coordination.ZS.clear()
                for location in locations:
                    new_location = get_object_or_404(ZS, pk=location['id'])
                    coordination.ZS.add(new_location)
            coordination.save()

        return Response(coordination.as_dict())

    def delete(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        coordination.delete()
        return Response(True)
