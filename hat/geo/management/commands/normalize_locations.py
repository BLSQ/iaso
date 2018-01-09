from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import Province, ZS, AS, Village


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):
        all_locations = Location.objects.all()
        problematic_location_count = 0
        for location in all_locations:
            if location.ZS and location.AS and location.village:
                if not location.province:
                    province = 'Kwilu'
                else:
                    province = location.province

                province, province_created = Province.objects.get_or_create(name=province)
                if province_created:
                    print("province %s created" % province)

                health_zone, health_zone_created = ZS.objects.get_or_create(name=location.ZS, province=province)
                if health_zone_created:
                    print("---- ZS %s created" % location.ZS)

                health_area, health_area_created = AS.objects.get_or_create(name=location.AS, ZS=health_zone)
                if health_area_created:
                    print("-------- AS %s created" % location.AS)

                village, village_created = Village.objects.get_or_create(name=location.village, AS=health_area,
                                                                         name_alt=location.village_alt,
                                                                         village_type=location.village_type,
                                                                         village_official=location.village_official,
                                                                         latitude=location.latitude,
                                                                         longitude=location.longitude,
                                                                         gps_source=location.gps_source,
                                                                         population=location.population,
                                                                         population_source=location.population_source,
                                                                         population_year=location.population_year,
                                                                         )
                if village_created:
                    print("------------ Village %s created" % location.village)
            else:
                print("***************************** Problematic location", location)
                problematic_location_count = problematic_location_count  + 1

        print("Number of problematic locations ", problematic_location_count)
