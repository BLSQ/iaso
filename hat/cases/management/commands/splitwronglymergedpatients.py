import gc

from django.core.management.base import BaseCommand
from django.db import connection

from hat.cases.models import Case
from hat.common.utils import queryset_iterator
from hat.geo.geo_finder import MultipleMatchesFoundException, get_single_village, \
    get_zones_by_name_or_alias, get_areas_by_name_or_alias
from hat.patient.identify import get_or_create_patient
from hat.patient.models import Test


class Command(BaseCommand):
    help = "Try to fix wrongly merged patients. Don't use if you have started merging patients"

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_patient_id__isnull=True)
        print(f"Cases to associate: {cases.count()}")
        patients_created = 0
        cases_associated_count = 0
        for case in cases:
            patient, patients_created = get_or_create_patient(case, case.normalized_AS, case.normalized_village)
            if patients_created:
                if options["verbose"]:
                    print("Patient created")
                patients_created += 1

            if options["verbose"]:
                print(f"Case {case.id} {case.prename} {case.lastname} in {case.village} ({case.normalized_village_id})")
            case.normalized_patient = patient
            case.save()
            cases_associated_count += 1

        print("----------------------------------------")
        print("Cases associated with a patient:", cases_associated_count)
        print("Patients created:", patients_created)
