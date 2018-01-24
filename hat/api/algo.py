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
        assigned, not_assigned = assign(village_ids, coordination_id, years)
        assignations = []
        unassigned = []
        for team_id in assigned.keys():
            temp_assignation = assigned[team_id]
            for village in temp_assignation.villages:
                assignations.append({'team_id': team_id, 'village_id': village.id})
        for village in not_assigned:
            assignations.append({'village_id': village.id, 'team_id': -1})

        return Response({'assignations': assignations})


