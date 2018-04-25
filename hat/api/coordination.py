from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.planning.models import Planning, Assignation
from hat.geo.models import ZS
from hat.users.models import Coordination
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from collections import defaultdict
from math import ceil

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
                size = len(assignation_list)
                for index, obj in enumerate(assignation_list):

                    Assignation.objects.filter(planning=planning, village_id=obj['village_id']).delete()
                    assignation = Assignation()
                    assignation.planning = planning
                    assignation.index = index
                    assignation.month = max(1, int(ceil((index * 12.0)/size)))
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
                    newLocation = get_object_or_404(ZS, pk=location['id'])
                    coordination.ZS.add(newLocation)
            coordination.save()

        return Response(coordination.as_dict())

    def delete(self, request, pk=None):
        coordination = get_object_or_404(Coordination, pk=pk)
        coordination.delete()
        return Response(True)
