import json5 as json5
from django.core.management.base import BaseCommand
from django.db.models import Q

from hat.geo.models import Province
import json


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):
        provinces = []

        for province in Province.objects.order_by('name'):
            zones = []
            province_dict = {
                "id": str(province.id),
                "name": province.name
            }

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
                        "id": str(area.id),
                        "name": area.name
                    }
                    #print("area", area.name)

                    for village in area.village_set.filter(Q(village_official="YES") | Q(village_source="device"))\
                            .order_by('name'):
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
            province_dict['zones'] = zones
            provinces.append(province_dict)

        print("Writing pretty print file /tmp/location_pretty.js")
        print("Include in mobile app locations_pretty folder to compare versions")
        f = open('/tmp/locations_pretty.json', 'w')
        f.write('{\nprovinces: ')
        f.write(json5.dumps(provinces, indent=2))
        f.write('}')
        f.close()

        print("Writing ugly print file /tmp/location_ugly.js")
        print("USE THIS FILE for src/location/index.js")
        f = open('/tmp/locations_ugly.js', 'w')
        f.write('module.exports = {provinces: ')
        f.write(json5.dumps(provinces))
        f.write('};')
        f.close()
