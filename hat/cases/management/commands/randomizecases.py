from django.core.management.base import BaseCommand
from hat.geo.models import Village
from hat.cases.models import Case
import random

def copy_village_fields(target, source):
    target.AS = source.AS
    target.name = source.name
    target.aliases = source.aliases
    target.name_alt = source.name_alt
    target.village_type = source.village_type
    target.village_source = source.village_source
    target.longitude = source.longitude
    target.latitude = source.latitude
    target.gps_source = source.gps_source
    target.location = source.location
    target.population = source.population
    target.population_source = source.population_source
    target.population_year = source.population_year


def copy_case_date_fields(target, source):
    target.document_date = source.document_date
    target.entry_date = source.entry_date
    target.form_year = source.form_year
    target.form_month = source.form_month


class Command(BaseCommand):
    help = 'Randomize and anonymize the content of the DB'

    def handle(self, *args, **options):
        all_cases = list(Case.objects.filter(confirmed_case=True))
        all_villages = list(Village.objects.filter(village_official="YES"))
        for i in range(10000):
            village_1 = random.choice(all_villages)
            village_2 = random.choice(all_villages)

            print("Inverting ")
            print("village 1", village_1)
            print("village 2", village_2)

            temp_village = Village()
            copy_village_fields(temp_village, village_1)
            copy_village_fields(village_1, village_2)
            copy_village_fields(village_2, temp_village)

            village_1.save()
            village_2.save()

            case_1 = random.choice(all_cases)
            case_2 = random.choice(all_cases)

            print("Inverting")
            print("case 1", case_1)
            print("case 2", case_2)

            temp_case = Case()
            copy_case_date_fields(temp_case, case_1)
            copy_case_date_fields(case_1, case_2)
            copy_case_date_fields(case_2, temp_case)

            case_1.save()
            case_2.save()
