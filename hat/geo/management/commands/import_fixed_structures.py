from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import Province, ZS, AS, Village, HealthStructure
import json
import csv
from django.contrib.gis.geos import Point
from hat.geo.geo_finder import MultipleMatchesFoundException, get_single_village, \
    get_zones_by_name_or_alias, get_areas_by_name_or_alias


def clean(s):
    prefixes = ['hu', 'tn', 'll', 'nu', 'sn', 'hk', 'kn', 'kc', 'as', 'bu', 'kl', 'su', 'ke', 'tu', 'eq', 'nk', 'lm', 'mn', 'sk', 'kr', 'hl', 'Kr', 'tp', 'mg', 'it', 'md', 'kg', 'ks']
    to_delete = [' Aire de Santé', " Zone de Santé", " Province", " Aire de Sante", "Aire de santé"]
    for x in to_delete:
        s = s.replace(x, '')
    for prefix in prefixes:
        s = s.replace(prefix + ' ', '')
    return s.strip()


class Command(BaseCommand):
    help = 'Import fixed structures from a json file'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str)

    def handle(self, *args, **options):

        file_path = options.get("file")
        f = open(file_path)
        j = json.loads(f.read())
        organisation_units = j['organisationUnits']
        counter = 0
        all_structures_not_found = []
        for org_unit in organisation_units:
            level = org_unit.get("level", None)
            cleaned_name = clean(org_unit['name'])
            identifier = org_unit['id']
            if level == 2:
                try:
                    province = Province.objects.get(name=cleaned_name)
                    if not province.source_ref:
                        province.source_ref = identifier
                        province.save()
                except:
                    print("NOT FOUND LEVEL 2", clean(org_unit['name']))

            if level == 3:
                province = Province.objects.get(source_ref=org_unit["parent"]["id"])
                zones = get_zones_by_name_or_alias(cleaned_name, [province])
                if len(zones) == 1:
                    zone = zones[0]
                    if not zone.source_ref:
                        zone.source_ref = identifier
                        zone.save()
                else:
                    print("NOT FOUND LEVEL 3", clean(org_unit['name']))
                    print("zone problem", zones)

            if level == 4:
                try:
                    zone = ZS.objects.get(source_ref=org_unit["parent"]["id"])
                    areas = get_areas_by_name_or_alias(cleaned_name, [zone])
                    if len(areas) == 1:
                        area = areas[0]
                        if not area.source_ref:
                            area.source_ref = identifier
                            area.save()
                    else:
                        print("NOT FOUND LEVEL 4", clean(org_unit['name']))
                        print("area problem", cleaned_name, areas)
                except:
                    print("exception: zone Not Found")

            if level == 5:
                try:
                    HealthStructure.objects.get(source_ref=identifier)
                except:
                    area = None
                    try:
                        area = AS.objects.get(source_ref=org_unit["parent"]["id"])
                    except:
                        print("NOT FOUND *******")
                        print(org_unit)
                        all_structures_not_found.append(org_unit['path'])

                        counter = counter + 1
                    if area is not None:
                        hs = HealthStructure()
                        hs.name = cleaned_name
                        hs.AS = area
                        hs.source_ref = identifier
                        hs.source = 'snis'
                        coordinates = org_unit.get("coordinates", None)
                        if coordinates is not None:
                            tuple = list(reversed(json.loads(coordinates)))
                            hs.location = Point(tuple)
                        hs.save()
                        print("structure created", cleaned_name)

        print("Structures NOT created", counter)

        print("all_structures_not_found")
        print(all_structures_not_found)