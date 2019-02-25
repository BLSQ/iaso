import argparse
import csv
import sys

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from hat.constants import GPS_SRID
from hat.geo.geo_finder import get_single_village, MultipleMatchesFoundException, get_single_zone, \
    get_areas_by_name_or_alias, get_areas_by_name
from hat.geo.models import GeopodeSettlement


def clean(s):
    prefixes = ['hu', 'tn', 'll', 'nu', 'sn', 'hk', 'kn', 'kc', 'as', 'bu', 'kl', 'su', 'ke', 'tu', 'eq', 'nk', 'lm', 'mn', 'sk', 'kr', 'hl', 'Kr', 'tp', 'mg', 'it', 'md', 'kg', 'ks']
    to_delete = [' Aire de Santé', " Zone de Santé", " Province"]
    for x in to_delete:
        s = s.replace(x, '')
    for prefix in prefixes:
        s = s.replace(prefix + ' ', '')
    return s.strip()


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

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
            type=argparse.FileType('r', encoding="latin1"),
            help='name of the csv file to import',
            nargs='?',
            default=sys.stdin
        )

    def handle(self, *args, **options):
        delimiter = ',' if options['delimiter'] is None else options['delimiter']
        if delimiter == '\\t':
            delimiter = "\t"
        quote_char = '"' if options['quote_char'] is None else options['quote_char']
        missing_areas = set()

        print("importing file", options['infile'].name)
        csv_reader = csv.reader(options['infile'], delimiter=delimiter, quotechar=quote_char)
        for row in csv_reader:
            if 'COD_' not in row[0]:  # non-exact match on province because of Unicode mess
                continue
            if len(row) < 14:
                continue
            (province_code, province_name, zs_code, zs_name, as_code, as_name, settlement_guid, settlement_name,
             settlement_type, lat, long, pop_female, pop_male, pop_total) = row[0:14]
            if settlement_guid:
                settlement, settlement_created = GeopodeSettlement.objects.get_or_create(
                    province_code=province_code,
                    province_name=province_name,
                    zone_code=zs_code,
                    zone_name=zs_name,
                    area_code=as_code,
                    area_name=as_name,
                    guid=settlement_guid,
                    name=settlement_name,
                    type=settlement_type,
                    lat=lat,
                    long=long,
                    location=Point(float(long.replace(",", ".")), float(lat.replace(",", ".")), srid=GPS_SRID) if
                    lat and long else None,
                    pop_female=pop_female.replace(".", "") if pop_female is not None and len(pop_female) > 0 else None,
                    pop_male=pop_male.replace(".", "") if pop_male is not None and len(pop_male) > 0 else None,
                    pop_total=pop_total.replace(".", "") if pop_total is not None and len(pop_total) > 0 else None,
                )
                if settlement_created and options['verbose']:
                    print("Created settlement", settlement.id, settlement.name)

                # Look for the village/AS/ZS
                if options['verbose']:
                    print("Looking for ZS", zs_name)
                zone = get_single_zone(zs_name)
                if not zone:
                    print("Couldn't find zone", zs_name)
                    continue

                settlement.normalized_zone = zone
                # settlement.save()

                if options['verbose']:
                    print("Looking for AS", as_name)
                areas = get_areas_by_name(as_name, [zone])
                if areas.count() == 0:  # if the exact name didn't work, try with aliases
                    areas = get_areas_by_name_or_alias(as_name, [zone])

                if areas.count() == 1:
                    if options['verbose']:
                        print("Area found", as_name)
                    settlement.normalized_area = areas[0]
                if areas.count() > 1:
                    print('Multiple matches found for', as_name, "in zone", zone.name, zone.id, areas)
                elif areas.count() == 0:
                    if options['verbose']:
                        print("Couldn't find area", as_name, "in zone", zone.name, zone.id)
                    missing_areas.add((as_name, zone.id))
                    continue

                # if settlement_name.startswith("HA_") or settlement_name.startswith("SSA_"):
                #     if options["verbose"]:
                #         print("Ignoring", settlement_name)
                #     continue
                # Look for village in those areas before adding a possible AS alias
                if options['verbose']:
                    print("looking for village", settlement_name)
                try:
                    village = get_single_village(settlement_name, areas)
                except MultipleMatchesFoundException:
                    village = None
                    print("******** Found multiple village matches", settlement_name, areas)

                if village:
                    settlement.normalized_village = village
                    settlement.normalized_area = village.AS
                    print(province_name, zs_name, as_name, settlement_name, "trypelim:", village.population, "geopode:",
                          pop_total)
                else:
                    print("Couldn't find village", settlement_name, "in area", [a.id for a in areas])
                    # similar_villages = Village.objects.filter(AS__in=areas).filter(name__trigram_similar=settlement_name)
                    # if similar_villages.count() > 0:
                    #     print("Similar villages:", ", ".join([f"{v.id}:{v.name}" for v in similar_villages]))
                    # else:
                    #     print("Villages in that area:",
                    #           ", ".join(
                    #               [f"{v.id}:{v.name}"
                    #                for v in Village.objects.filter(AS__in=areas)
                    #                ]
                    #           ))

                settlement.save()

        print("Missing areas:", "\n".join([f"{x[1]}: {x[0]}" for x in missing_areas]))
