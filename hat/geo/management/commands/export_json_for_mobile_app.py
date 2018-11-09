from django.core.management.base import BaseCommand
from hat.geo.models import Province, ZS, AS, Village
import json


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):
        provinces = Province.objects.filter(name__in=['Maindombe', 'Kwilu', 'Kwango'])
        zones = []
        for province in provinces:
            #print("PROVINCE", province.name)
            for zone in province.zs_set.order_by('name'):
                areas = []
                zone_dict = {
                    "id": str(zone.id),
                    "name": zone.name
                }
                print("ZONE", zone.name)

                for area in zone.as_set.order_by('name'):
                    villages = []
                    structures = []
                    area_dict = {
                        "id": str(zone.id),
                        "name": zone.name
                    }
                    #print("area", area.name)

                    for village in area.village_set.filter(village_official="YES").order_by('name'):
                        village_dict = {
                            'id': str(village.id),
                            'name': village.name,
                        }
                        villages.append(village_dict)

                    for structure in area.healthstructure_set.order_by('name'):
                        structure_dict = {
                            'id': str(structure.id),
                            'name': structure.name,
                        }
                        structures.append(structure_dict)

                    area_dict['villages'] = villages
                    area_dict['structures'] = structures
                    areas.append(area_dict)

                zone_dict['areas'] = areas
                zones.append(zone_dict)
        zones_sorted = sorted(zones, key=lambda k: k['name'])

        f = open('location.js', 'w')
        f.write('module.exports = {locations: [')
        f.write(json.dumps(zones_sorted))
        f.write(']};')
        f.close()
