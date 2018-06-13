from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import ZS, AS, Village


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):

        print("-- NORMALIZING VILLAGES --")

        all_locations = Location.objects.filter(already_put_in_normalized_form=False)
        problematic_location_count = 0
        village_count = 0

        for location in all_locations:
            if location.ZS and location.AS and location.village:

                    health_zone = None
                    try:
                        health_zone = ZS.objects.get(name__iexact=location.ZS)
                    except ZS.DoesNotExist:
                        health_zones = ZS.objects.filter(aliases__contains=[location.ZS])
                        if len(health_zones) > 1:
                            print("Multiple health zones have the following alias, can't decide: ", location.ZS)
                        elif len(health_zones) == 1:
                            print("Found a zone through an alias", location.ZS)
                            health_zone = health_zones[0]
                        else:
                            print("ZS not found", location.ZS)

                    if health_zone:
                        health_area = None
                        try:
                            health_area = AS.objects.get(name__iexact=location.AS, ZS=health_zone)
                        except AS.DoesNotExist:
                            health_areas = AS.objects.filter(aliases__contains=[location.AS], ZS=health_zone)
                            if len(health_areas) > 1:
                                print("Multiple health areas have the following alias, can't decide: ", location.AS)
                            elif len(health_areas) == 1:
                                print("Found an area through an alias", location.AS)
                                health_area = health_areas[0]
                            else:
                                print("AS not found", location.AS)

                        if health_area:
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
                            location.already_put_in_normalized_form = True
                            location.save()

                    village_count += 1
                    if village_count % 1000 == 0:
                        print("Village Count", village_count)

            else:
                print("***************************** Problematic location", location)
                problematic_location_count = problematic_location_count + 1

        print("Number of problematic locations ", problematic_location_count)


