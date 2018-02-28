from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.geo.models import Village, ZS, AS
import gc


def queryset_iterator(queryset, chunksize=1000):
    '''''
    Iterate over a Django Queryset ordered by the primary key

    This method loads a maximum of chunksize (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.

    Note that the implementation of the iterator does not support ordered query sets.
    '''
    pk = 0
    last_pk = queryset.order_by('-pk')[0].pk
    queryset = queryset.order_by('pk')
    while pk < last_pk:
        for row in queryset.filter(pk__gt=pk)[:chunksize]:
            pk = row.pk
            yield row
        gc.collect()


class Command(BaseCommand):
    help = 'Try to link a case to a previously known village'

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village__isnull=True, village__isnull=False, AS__isnull=False,
                                    ZS__isnull=False, province__isnull=False)
        success_count = 0
        count = 0
        for case in queryset_iterator(cases):
            count += 1
            if count % 1000 == 0:
                print("Cases treated: ", count)

            zone_name = case.ZS.strip()
            area_name = case.AS.strip()
            village_name = case.village.strip()

            zones = ZS.objects.filter(name__iexact=zone_name)
            zone = None
            if zones.count() == 1:
                zone = zones[0]

            if not zone:
                a_zones = ZS.objects.filter(aliases__contains=[zone_name])
                if a_zones.count() == 1:
                    zone = a_zones[0]

            area = None
            areas = AS.objects.filter(name__iexact=area_name, ZS=zone)
            if areas.count() == 1:
                area = areas[0]

            if zone and not area:
                a_areas = AS.objects.filter(aliases__contains=[area_name], ZS=zone)
                if a_areas.count() == 1:
                    area = a_areas[0]

            villages = Village.objects.filter(name__iexact=village_name, AS=area)
            village_count = villages.count()
            if village_count == 1:
                case.normalized_village = villages[0]
                case.save()
                success_count += 1
                print("+++++++ Village found for:", zone_name, area_name, village_name)
            elif village_count == 0:
                pass
                # print("xxxxxxx Village NOT found for:", zone_name, area_name, village_name)
            else:
                print("??????? Multiple villages found for:", zone_name, area_name, village_name)

        print("----------------------------------------")
        print("Cases matched with known villages:", success_count)
