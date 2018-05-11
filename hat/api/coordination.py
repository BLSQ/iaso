from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from tsp_solver.greedy import solve_tsp
from geopy.distance import vincenty
from hat.planning.models import Planning, Assignation
from hat.geo.models import ZS, Village
from hat.users.models import Coordination
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from collections import defaultdict


def optimize_path(assignation_list):
    matrix = [[] for _ in assignation_list]

    village_ids = [obj['village_id'] for obj in assignation_list]
    village_queryset = Village.objects.filter(id__in=village_ids)
    villages = {v.id: v for v in village_queryset}
    total_population = sum([village.population for village in village_queryset])
    i = 0
    for assignation1 in assignation_list:
        j = 0
        village_1 = villages[assignation1['village_id']]
        for assignation2 in assignation_list:
            village_2 = villages[assignation2['village_id']]
            village_1_coordinates = (village_1.longitude, village_1.latitude)
            village_2_coordinates = (village_2.longitude, village_2.latitude)
            matrix[i].append(vincenty(village_1_coordinates, village_2_coordinates).km)
            j += 1
        i += 1
    path = solve_tsp(matrix)
    res = []
    current_population = 0
    current_month = 1

    i = 0

    for index in path:
        assignation_dict = assignation_list[index]
        current_population += villages[assignation_dict['village_id']].population
        if current_population > (total_population / 12.0) * current_month:
            current_month += 1
        assignation_dict['month'] = min(current_month, 12)
        assignation_dict['index'] = i
        res.append(assignation_list[index])
        i += 1

    return res


class CoordinationViewSet(viewsets.ViewSet):
    """
    Api to list all coordinations,  retrieve information about just one, or update the assignations for a coordination.
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

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
        coordination = get_object_or_404(Coordination, pk=pk)
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
