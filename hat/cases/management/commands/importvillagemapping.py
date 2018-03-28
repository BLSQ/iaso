import argparse
import csv
import sys

from django.core.management import BaseCommand

from hat.fixtures.geo_finder import get_single_zone, get_single_area, get_single_village


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

        print("importing file", options['infile'].name)
        csv_reader = csv.reader(options['infile'], delimiter=delimiter, quotechar=quote_char)
        for row in csv_reader:
            if row[12] == "Y":
                # Look for the village/AS/ZS
                if options['verbose']:
                    print("Looking for ZS", row[6])
                zone = get_single_zone(row[6])
                if not zone:
                    print("Couldn't find zone", row[6])
                    continue

                if options['verbose']:
                    print("Looking for AS", row[7])
                area = get_single_area(row[7], zone)
                if not area:
                    print("Couldn't find area", row[7], "in zone", zone.name, zone.id)
                    continue

                if options['verbose']:
                    print("looking for village", row[8])
                village = get_single_village(row[8], area)
                if not village:
                    print("Couldn't find village", row[8])
                    continue
                else:
                    if options['verbose']:
                        print("found village with id", village.id)

                if (village.aliases is not None and row[3] in village.aliases) \
                        or row[3].lower() == village.name.lower():
                    print("The alias is already present, ignoring", village.name)
                else:
                    if not village.aliases:
                        village.aliases = []
                    village.aliases.append(row[3])
                    print("Adding alias '%s' to village '%s' (%s) in area '%s' (%s) in zone %s (%s) resulting in %s"
                          % (row[3], village.name, village.id, area.name, area.id, zone.name, zone.id, village.aliases))
                    village.save()
