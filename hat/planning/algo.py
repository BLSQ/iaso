from tsp_solver.greedy import solve_tsp
from geopy.distance import vincenty
from django.db.models import Count
from django.db.models import Q

from functools import cmp_to_key
import random
from hat.planning.models import WorkZone
from hat.geo.models import Village


def village_comparator(village_1, village_2):
    positive_1 = village_1.nr_positive_cases > 0
    positive_2 = village_2.nr_positive_cases > 0

    if positive_1 and not positive_2:
        return 1
    elif positive_2 and not positive_1:
        return -1
    else:
        pop1 = village_1.population
        pop2 = village_2.population

        if pop1 is None:
            pop1 = 0
        if pop2 is None:
            pop2 = 0
        if pop1 > pop2:
            return 1
        elif pop1 < pop2:
            return -1

    return 0


def sort_villages(id_list=[], years=[]):

    queryset = Village.objects.filter(id__in=id_list, village_official='YES', population__isnull=False)

    nr_positive_cases = Count('caseview', filter=Q(caseview__confirmed_case=True, caseview__normalized_year__in=years))
    villages = queryset.annotate(nr_positive_cases=nr_positive_cases)
    return sorted(villages, key=cmp_to_key(village_comparator), reverse=True)


class TempAssignation:

    def __init__(self):
        self.population_reached = 0
        self.villages = []

    def __repr__(self):
        return str(self.villages)


def assign(village_id_list, workzone_id, years=[]):
    village_list = sort_villages(village_id_list, years)
    workzone = WorkZone.objects.get(pk=workzone_id)
    teams = list(workzone.teams.order_by('-UM', '-capacity'))
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
            population = village.population
            if population is None:
                population = 0
            if temp_assignation.population_reached + population < team.capacity:
                #test if village in ZS/AS of team

                if not village.assigned and village.AS in team.get_as(workzone.planning_id):
                    temp_assignation.villages.append(village)
                    temp_assignation.population_reached += population
                    village.assigned = True

        if not village.assigned:
            not_assigned.append(village)

    return assignations, not_assigned


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






