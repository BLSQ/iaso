from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import Province, ZS, AS, Village
import json

class Command(BaseCommand):
    help = 'Import ZS, AS and Provinces from the shapes.json file'

    def handle(self, *args, **options):
        f = open('hat/assets/js/apps/Plannings/utils/shapes.json')
        shapes = json.loads(f.read())

        for health_areas in shapes['objects']['areas']['geometries']:
            print(health_areas)
            props = health_areas['properties']

            OLD_PROV = props['OLD_PROV'].title()
            NEW_PROV = props['NEW_PROV'].title()
            ZS_s = props['ZS'].title()
            AS_s = props['AS'].title()

            province, province_created = Province.objects.get_or_create(name=NEW_PROV, defaults={'old_name': OLD_PROV})
            if province_created:
                print("province %s created" % province)

            health_zone, health_zone_created = ZS.objects.get_or_create(name=ZS_s, province=province)
            if health_zone_created:
                print("---- ZS %s created" % ZS_s)

            health_area, health_area_created = AS.objects.get_or_create(name=AS_s, ZS=health_zone)
            if health_area_created:
                print("-------- AS %s created" % AS_s)




