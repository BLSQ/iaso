from hat.planning.algo import sort_villages, assign
from hat.geo.models import Village
from hat.planning.models import Assignation, Planning
from hat.users.models import Coordination

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Test algo'

    def handle(self, *args, **options):
        planning = Planning.objects.get(pk=2)
        Assignation.objects.filter(planning=planning).delete()

        coordination = Coordination.objects.get(pk=1)
        villages = Village.objects.filter(AS__ZS__in=coordination.ZS.all()).filter(village_official='YES')
        print(villages.query)
        village_ids = map(lambda x: x.id, villages)

        assignations, not_assigned = assign(village_ids, coordination.id, years=[2013, 2014, 2015, 2016, 2017])

        for team_id in assignations.keys():
            temp_assignation = assignations[team_id]
            for village in temp_assignation.villages:
                ass = Assignation()
                ass.team_id = team_id
                ass.village = village
                ass.planning = planning
                ass.save()

        #village_ids = map(lambda x: x['id'], Village.objects.filter(AS__ZS_id=8).values("id").filter(village_official='YES'))
        #id_list = list(village_ids)
        #print("village_ids", )

        #sorted_v = sort_villages(id_list, years=[2017, 2016, 2015, 2014, 2013])
        #for village in sorted_v:
            #print("village", village.nr_positive_cases > 0, village.population)

