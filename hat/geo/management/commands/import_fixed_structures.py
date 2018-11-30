import json
import re

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from hat.geo.geo_finder import get_zones_by_name_or_alias, get_areas_by_name_or_alias, get_areas_by_name
from hat.geo.models import Province, ZS, AS, HealthStructure


def clean(s):
    prefixes = ['hu', 'tn', 'll', 'nu', 'sn', 'hk', 'kn', 'kc', 'as', 'bu', 'kl', 'su', 'ke', 'tu', 'eq', 'nk', 'lm', 'mn', 'sk', 'kr', 'hl', 'Kr', 'tp', 'mg', 'it', 'md', 'kg', 'ks', 'Ks']
    to_delete = [re.compile(regex, re.IGNORECASE) for regex in [r' *aire +de +sant. *', r" *Zone +de +Sant. *", r" *Province *"]]
    for x in to_delete:
        s = x.sub('', s)
    for prefix in prefixes:
        s = s.replace(prefix + ' ', '')
    return s.strip()


class Command(BaseCommand):
    help = 'Import fixed structures from a json file'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str)
        parser.add_argument(
            '--asonly',
            action='store_true',
            dest='asonly',
            help='Only import until AS level (4), not structures (L5)',
        )
        parser.add_argument(
            '--create',
            action='store_true',
            dest='create',
            help='When no ZS/AS match is found, create it. Will not import shapes',
        )

    def handle(self, *args, **options):

        file_path = options.get("file")
        f = open(file_path)
        j = json.loads(f.read())
        organisation_units = j['organisationUnits']
        counter = 0
        all_structures_not_found = []
        for current_level in [2, 3, 4, 5]:
            print('current_level', current_level)
            for org_unit in organisation_units:
                level = org_unit.get("level", None)
                cleaned_name = clean(org_unit['name'])
                identifier = org_unit['id']
                if level == current_level and current_level == 2:
                    try:
                        province = Province.objects.get(name__iexact=cleaned_name)
                        if not province.source_ref:
                            province.source_ref = identifier
                            province.save()
                    except:
                        print("NOT FOUND LEVEL 2", cleaned_name)

                if level == current_level and current_level == 3:
                    province = Province.objects.get(source_ref=org_unit["parent"]["id"])
                    zones = get_zones_by_name_or_alias(cleaned_name, [province])
                    if len(zones) == 1:
                        zone = zones[0]
                        if not zone.source_ref:
                            zone.source_ref = identifier
                            zone.save()
                    else:
                        if options.get("create", False) and len(zones) == 0:
                            print("CREATE ZS", cleaned_name, "IN PROVINCE", province.id, province.name)
                            ZS.objects.create(
                                name=cleaned_name,
                                source="snis",
                                source_ref=org_unit["id"],
                                province=province,
                            )
                        print("NOT FOUND LEVEL 3", clean(org_unit['name']))
                        print("zone problem", zones)

                if level == current_level and current_level == 4:
                    try:
                        zone = ZS.objects.get(source_ref=org_unit["parent"]["id"])
                        areas = list(get_areas_by_name(cleaned_name, [zone]))
                        if len(areas) == 0:
                            areas = list(get_areas_by_name_or_alias(cleaned_name, [zone]))
                        if len(areas) == 1:
                            area = areas[0]
                            if not area.source_ref:
                                area.source_ref = identifier
                                area.save()
                        else:
                            if len(areas) == 0:
                                if options.get("create", False):
                                    print("CREATE AS", cleaned_name, "IN ZONE", zone.id, zone.name)
                                    AS.objects.create(
                                        name=cleaned_name,
                                        ZS=zone,
                                        source="snis",
                                        source_ref=org_unit["id"]
                                    )
                                else:
                                    print("NOT FOUND LEVEL 4", cleaned_name, "IN ZONE", zone.id, zone.name)
                                    potential_matches = AS.objects.filter(ZS=zone)\
                                        .filter(name__trigram_similar=cleaned_name)\
                                        .filter(source_ref__isnull=True)
                                    if potential_matches.count() > 0:
                                        for m in potential_matches:
                                            print("Potential match: ", m, "=>",
                                                  f"update geo_as set aliases=array_append(aliases, '{cleaned_name}') "
                                                  f"where id={m.id} and name='{m.name}';")
                                    else:
                                        print("Couldn't find a potential match in this ZS, options are:",
                                              [str(a.id) + " " + a.name
                                               for a in AS.objects.filter(ZS=zone).filter(source_ref__isnull=True)
                                               ]
                                              )
                            else:
                                print("NOT FOUND LEVEL 4", cleaned_name,
                                      "MULTIPLE MATCHES", ", ".join([str(a.id) for a in areas]))
                    except ZS.DoesNotExist:
                        print("exception: zone Not Found", org_unit["parent"]["id"])
                    except Exception as e:
                        print("Unknown exception occurred", str(e))
                        raise e

                if level == current_level and current_level == 5 and not options.get('asonly', False):
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
