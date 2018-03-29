import gc

from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.fixtures.geo_finder import get_single_zone, MultipleMatchesFoundException, get_single_area, get_single_village


def queryset_iterator(queryset, chunksize=1000):
    """''
    Iterate over a Django Queryset ordered by the primary key

    This method loads a maximum of chunksize (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.

    Note that the implementation of the iterator does not support ordered query sets.
    """
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

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village__isnull=True, village__isnull=False, AS__isnull=False,
                                    ZS__isnull=False)
        success_count = 0
        count = 0
        for case in queryset_iterator(cases):
            count += 1
            if count % 1000 == 0:
                print("Cases treated: ", count)

            zone_name = case.ZS.strip()
            area_name = case.AS.strip()
            village_name = case.village.strip()

            if options['verbose']:
                print("finding zone_name", zone_name)
            try:
                zone = get_single_zone(zone_name)
            except MultipleMatchesFoundException:
                print("Multiple matching zones found for zone_name", zone_name)
                continue

            if options['verbose']:
                print("finding area_name", area_name, "in this zone")
            try:
                area = get_single_area(area_name, zone)
            except MultipleMatchesFoundException:
                if zone is None:
                    print("Multiple matching areas", area_name, "found without zone specified")
                else:
                    print("Multiple matching areas", area_name, "found for zone", zone.name)
                continue

            if area is None:
                if options['verbose']:
                    print("Area", area_name, "not found, skipping")
                continue

            try:
                village = get_single_village(village_name, area)
            except MultipleMatchesFoundException:
                print("??????? Multiple villages found for:", zone_name, area_name, village_name)
                continue

            if village is not None:
                case.normalized_village = village
                case.save()
                success_count += 1
                print("+++++++ Village found for:", zone_name, area_name, village_name)

        print("----------------------------------------")
        print("Cases matched with known villages:", success_count)
