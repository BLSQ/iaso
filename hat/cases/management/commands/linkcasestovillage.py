import gc

from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.common.utils import queryset_iterator
from hat.geo.geo_finder import MultipleMatchesFoundException, get_single_village, \
    get_zones_by_name_or_alias, get_areas_by_name_or_alias
from hat.patient.models import Test


class Command(BaseCommand):
    help = 'Try to link a case to a previously known village'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry-run',
            help='Go through the process but don\'t actually save the normalized village',
        )

        parser.add_argument(
            '--unofficial',
            action='store_true',
            dest='unofficial',
            help='Also match unofficial villages. This will create some multiple matching, one with the official '
                 'village, one with the unofficial',
        )

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village__isnull=True, village__isnull=False, AS__isnull=False,
                                    ZS__isnull=False)
        success_count = 0
        count = 0
        official = None if options['unofficial'] else 'YES'
        for case in queryset_iterator(cases):
            count += 1
            if count % 1000 == 0:
                print("Cases treated: ", count)

            zone_name = case.ZS.strip()
            area_name = case.AS.strip()
            village_name = case.village.strip()

            if options['verbose']:
                print("finding zone_name", zone_name)
            zones = get_zones_by_name_or_alias(zone_name)

            if options['verbose']:
                print("finding area_name", area_name, "in this zone")
            areas = get_areas_by_name_or_alias(area_name, zones)

            if areas.count() == 0:
                if options['verbose']:
                    print("Area", area_name, "not found, skipping")
                continue

            try:
                village = get_single_village(village_name, areas, official=official)
            except MultipleMatchesFoundException:
                print("??????? Multiple villages found for:", zone_name, area_name, village_name)
                continue

            if village is not None:
                if options['dry-run']:
                    print("Dry-run: would have updated case id", case.id, "to village", village.id)
                else:
                    case.normalized_village = village
                    case.normalized_AS = village.AS
                    case.save()

                    # Now update the Test from that case
                    Test.objects.filter(form=case).update(village=village)
                success_count += 1
                print("+++++++ Village found for:", zone_name, area_name, village_name)
            elif areas.count() == 1:
                case.normalized_AS = areas[0]
                case.save()
                print("+++++++ Village not found but Area found for:", zone_name, area_name, village_name)

        print("----------------------------------------")
        print("Cases matched with known villages:", success_count)
