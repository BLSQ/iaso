from rest_framework import viewsets
from rest_framework.response import Response
from hat.planning.algo import assign


class AlgoViewSet(viewsets.ViewSet):
    """
        API to compute an allocation of a list villages to teams of a given coordination, taking
        into account the cases that happened during the provided years.

        Parameters:
            village_id: a comma separated list of village ids
            coordination_id: the id of the coordination
            years: a comma separated list of years.
    """

    def list(self, request):
        village_ids = request.GET.get('village_id', None).split(',')
        coordination_id = request.GET.get('coordination_id', None)
        years = request.GET.get('years', None).split(',')
        assignations, not_assigned = assign(village_ids, coordination_id, years)
        res = []

        for team_id in assignations.keys():
            temp_assignation = assignations[team_id]
            for village in temp_assignation.villages:
                res.append({'team_id': team_id, 'village_id': village.id})

        return Response(res)


