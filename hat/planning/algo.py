from hat.users.models import Team
from hat.geo.models import Village
from django.db.models import Count
from django.db.models import Q
from functools import cmp_to_key
import random

def village_comparator(village_1, village_2):
    positive_1 = village_1.nr_positive_cases > 0
    positive_2 = village_2.nr_positive_cases > 0

    if positive_1 and not positive_2:
        return 1
    elif positive_2 and not positive_1:
        return -1
    else:
        if village_1.population > village_2.population:
            return 1
        elif village_1.population < village_2.population:
            return -1

    return 0


def sort_villages(id_list=[], years=[]):

    queryset = Village.objects.filter(id__in=id_list)

    nr_positive_cases = Count('case', filter=Q(case__confirmed_case=True, case__document_date__year__in=years))
    villages = queryset.annotate(nr_positive_cases=nr_positive_cases)

    return sorted(villages, key=cmp_to_key(village_comparator), reverse=True)


class TempAssignation:

    def __init__(self):
        self.population_reached = 0
        self.villages = []

    def __repr__(self):
        return str(self.villages)


def assign(village_id_list, coordination_id, years=[]):
    village_list = sort_villages(village_id_list, years)
    teams = list(Team.objects.filter(coordination_id=coordination_id).order_by('-UM', '-capacity'))
    assignations = {team.id: TempAssignation() for team in teams}
    # team_id -> (population_reached, assignations
    not_assigned = []
    UMS = list(filter(lambda t: t.UM, teams))
    MUMS = list(filter(lambda t: not t.UM, teams))

    for village in village_list:
        village.assigned = False
        random.shuffle(UMS)
        random.shuffle(MUMS)
        current_team_list = UMS + MUMS

        for team in current_team_list:
            temp_assignation = assignations[team.id]
            if temp_assignation.population_reached + village.population < team.capacity:
                #test if village in ZS/AS of team
                if not village.assigned and village.AS in team.get_as():
                    temp_assignation.villages.append(village)
                    temp_assignation.population_reached += village.population
                    village.assigned = True

        if not village.assigned:
            not_assigned.append(village)

    return assignations, not_assigned







