from django.core.management.base import BaseCommand
from django.db.models import Q

from hat.cases.models import Case
from hat.patient.identify import create_test_data


class Command(BaseCommand):
    help = "Some test types where not added to patient_test, this fixes that for existing data"

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

    def handle(self, *args, **options):
        cases = Case.objects.filter(
            Q(test_parasit__isnull=False) |
            Q(test_ifat__isnull=False) |
            Q(test_ge__isnull=False) |
            Q(test_sf__isnull=False) |
            Q(test_dil__isnull=False) |
            Q(test_lymph_node_puncture__isnull=False) |
            Q(test_clinical_sickness__isnull=False) |
            Q(test_sternal_puncture__isnull=False) |
            Q(test_lcr__isnull=False)
        )

        print(f"Cases with old tests to process: {cases.count()}")
        total_tests_created = 0
        for case in cases:
            if options['verbose']:
                print(f"Updating case {case.id}")
            existing_test = case.test_set.first()
            existing_patient_area = existing_test.traveller_area if existing_test else None
            tests, tests_created = create_test_data(case, patient_area=existing_patient_area, raw={})
            total_tests_created += tests_created
            if options['verbose']:
                print(f"Create tests {tests_created}")

        print(f"Done. Created {total_tests_created} tests")
