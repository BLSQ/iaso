from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import Province, ZS, AS, Village


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):

        print("-- NORMALIZING VILLAGES --")

        all_locations = Location.objects.filter(already_put_in_normalized_form=False)
        problematic_location_count = 0
        village_count = 0
        created_areas = []
        created_zones = []
        for location in all_locations:
            if location.ZS and location.AS and location.village:

                try:
                    health_zone, health_zone_created = ZS.objects.get_or_create(name=location.ZS)
                    if health_zone_created:
                        created_zones.append(location.ZS)

                    health_area, health_area_created = AS.objects.get_or_create(name=location.AS, ZS=health_zone)
                    if health_area_created:
                        created_areas.append(location.AS)

                    village, village_created = Village.objects.get_or_create(name=location.village,
                                                                             AS=health_area,
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
                    village_count += 1
                    if village_count % 1000 == 0:
                        print("Village Count", village_count)

                    location.already_put_in_normalized_form = True
                    location.save()

                except Exception as e:
                    print("EXCEPTION", e)
                    print(location.province, location.ZS, location.AS, location.village)
            else:
                print("***************************** Problematic location", location)
                problematic_location_count = problematic_location_count  + 1

        print("Number of problematic locations ", problematic_location_count)
        print("created_areas", created_areas)
        print("created_zones", created_zones)

