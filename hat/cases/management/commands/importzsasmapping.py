import argparse
import csv
import sys

from django.core.management import BaseCommand

from hat.geo.geo_finder import get_single_zone, get_single_area, MultipleMatchesFoundException
from hat.geo.models import ZSASMappingImport, ZSASMappingItem


class Command(BaseCommand):
    help = '''
    Take a CSV file mapping the ZS and AS to actual zones and areas into the database.
    Multiple matches on an area prevent this import from doing its job. Such special cases can be checked manually:
    select *
    from geo_as a1 
    inner JOIN geo_as a2 on a1.name = any (a2.aliases) and a1.id<>a2.id and a1."ZS_id"=a2."ZS_id";
    
    They are however acceptable because cases will use the village name to distinguish between matching areas.
    '''

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
        zsas_import = ZSASMappingImport(file_name=options['infile'].name)
        zsas_import.save()

        print("importing file", options['infile'].name)
        csv_reader = csv.reader(options['infile'], delimiter=delimiter, quotechar=quote_char)
        for row in csv_reader:
            if csv_reader.line_num == 1 and 'province' in row[0]:  # non-exact match on province because of Unicode mess
                continue
            (case_prov, case_zone, case_area, case_count, match_prov, match_zone, match_area, match_yn) = row[0:8]
            item = ZSASMappingItem(zsas_import=zsas_import, line=csv_reader.line_num, case_province=case_prov,
                                   case_zs=case_zone, case_as=case_area, match_province=match_prov, match_zs=match_zone,
                                   match_as=match_area, match_yesno=match_yn,
                                   match_comment=row[9] if 9 < len(row) else None)

            if match_yn == "Y":
                # Look for the village/AS/ZS
                if options['verbose']:
                    print("Looking for ZS", match_zone)
                zone = get_single_zone(match_zone)
                if not zone:
                    print("Couldn't find zone", match_zone)
                    continue

                # If the zone differs, check whether a zone alias is needed
                if case_zone is not None and match_zone != case_zone:
                    if case_zone.lower() != match_zone.lower() and \
                            (zone.aliases is None or case_zone not in zone.aliases):
                        if options['verbose']:
                            print("Adding zone", case_zone, "to zone", zone.name, "aliases before:", zone.aliases)
                        if zone.aliases is None:
                            zone.aliases = [case_zone]
                        else:
                            zone.aliases.append(case_zone)
                        item.added_zone_alias = True
                        added_zone_aliases += 1
                        zone.save()

                if options['verbose']:
                    print("Looking for AS", match_area)
                try:
                    area = get_single_area(match_area, zone)
                except MultipleMatchesFoundException:
                    print('Multiple matches found for', match_area, "in zone", zone.name, zone.id)
                    continue
                if not area:
                    print("Couldn't find area", match_area, "in zone", zone.name, zone.id)
                    continue

                # If the zone differs, check whether a zone alias is needed
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
                        item.added_area_alias = True
                        area.save()
            item.save()

        print("Added zone aliases", added_zone_aliases, "and area aliases", added_area_aliases)
