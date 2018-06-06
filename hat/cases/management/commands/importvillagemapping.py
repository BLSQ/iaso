import argparse
import csv
import sys

from django.core.management import BaseCommand

from hat.geo.geo_finder import get_single_zone, get_single_village, get_areas_by_name_or_alias, \
    MultipleMatchesFoundException


class Command(BaseCommand):
    help = 'Take a CSV file mapping the cases_case villages to actual villages and try make some sense of it'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

        parser.add_argument(
            '--delimiter',
            action='store',
            dest='delimiter',
            help='column delimiter, defaults to ,',
        )

        parser.add_argument(
            '--quote',
            action='store',
            dest='quote_char',
            help='quote character, defaults to "',
        )

        parser.add_argument(
            'infile',
            metavar='input_file',
            type=argparse.FileType('r'),
            help='name of the csv file to import',
            nargs='?',
            default=sys.stdin
        )

    def handle(self, *args, **options):
        delimiter = ',' if options['delimiter'] is None else options['delimiter']
        quote_char = '"' if options['quote_char'] is None else options['quote_char']
        added_zone_aliases = 0
        added_area_aliases = 0

        print("importing file", options['infile'].name)
        csv_reader = csv.reader(options['infile'], delimiter=delimiter, quotechar=quote_char)
        for row in csv_reader:
            if csv_reader.line_num == 1 and 'province' in row[0]:  # non-exact match on province because of Unicode mess
                continue
            (case_prov, case_zone, case_area, case_village, count, match_prov,
             match_zone, match_area, match_village, map_yn) = row[0:10]
            if map_yn == 'Y' or map_yn == 'O':
                # Look for the village/AS/ZS
                if options['verbose']:
                    print("Looking for ZS", match_zone)
                zone = get_single_zone(match_zone)
                if not zone:
                    print("Couldn't find zone", match_zone)
                    continue

                # If the zone differs, check whether a zone alias is needed
                if case_zone is not None and case_zone != '' and match_zone != case_zone:
                    if case_zone.lower() != match_zone.lower() and \
                            (zone.aliases is None or case_zone not in zone.aliases):
                        if options['verbose']:
                            print("Adding zone", case_zone, "to zone", zone.name, "aliases before:", zone.aliases)
                        if zone.aliases is None:
                            zone.aliases = [case_zone]
                        else:
                            zone.aliases.append(case_zone)
                        # item.added_zone_alias = True
                        added_zone_aliases += 1
                        zone.save()

                if options['verbose']:
                    print("Looking for AS", match_area)
                areas = get_areas_by_name_or_alias(match_area, [zone])
                if areas.count() == 1 and options['verbose']:
                    print("Area found", match_area)
                if areas.count() > 1:
                    print('Multiple matches found for', match_area, "in zone", zone.name, zone.id, areas)
                elif areas.count() == 0:
                    print("Couldn't find area", match_area, "in zone", zone.name, zone.id)
                    continue

                # Look for village in those areas before adding a possible AS alias
                if options['verbose']:
                    print("looking for village", match_village)
                try:
                    village = get_single_village(match_village, areas)
                except MultipleMatchesFoundException:
                    print("******** Found multiple village matches", match_village, areas)

                if not village:
                    print("Couldn't find village", match_village)
                    continue

                # ###Only executed if the village was found###

                if options['verbose']:
                    print("found village with id", village.id)

                area = village.AS

                # If the area differs, check whether an area alias is needed
                if case_area is not None and match_area != case_area:
                    if case_area.lower() != match_area.lower() and (
                            area.aliases is None or case_area not in area.aliases):
                        if options['verbose']:
                            print("Adding alias", case_area, "to area", area.name, "aliases before:", area.aliases)
                        if area.aliases is None:
                            area.aliases = [case_area]
                        else:
                            area.aliases.append(case_area)
                        added_area_aliases += 1
                        area.save()

                if (village.aliases is not None and case_village in village.aliases) \
                        or case_village.lower() == village.name.lower():
                    print("The alias is already present, ignoring", village.name)
                else:
                    if not village.aliases:
                        village.aliases = []
                    village.aliases.append(case_village)
                    print("Adding alias '%s' to village '%s' (%s) in area '%s' (%s) in zone %s (%s) resulting in %s"
                          % (case_village, village.name, village.id, area.name, area.id, zone.name, zone.id, village.aliases))
                    village.save()
