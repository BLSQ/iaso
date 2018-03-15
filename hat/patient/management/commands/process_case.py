from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.patient.identify import Identify
from hat.patient.models import Patient, Test


class Command(BaseCommand):
    help = 'Process cases_case to dispatch into patient_patient and patient_test'

    identifier = Identify()

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            dest='force',
            help='Force the processing of all data, not just unnormalized rows',
        )

        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

    def handle(self, *args, **options):

        print("-- NORMALIZING patient data --")

        all_cases = Case.objects.filter(source='mobile_sync')
        if not options['force']:
            all_cases = all_cases.filter(normalized_patient_id=None)
        patient_created_count = 0
        for case in all_cases:

            if options['verbose']:
                print("Processing", case.prename, case.lastname, case.name, case.mothers_surname, case.year_of_birth)

            try:
                # Normalize the patient data
                patient, patient_created = self.identifier.get_or_create_patient(case)
                if patient_created:
                    patient_created_count += 1
                    if options['verbose'] or patient_created_count % 100 == 0:
                        print("New patient created count: ", patient_created_count)

                case.normalized_patient = patient

                # Normalize the test data
                tests, tests_created = self.identifier.create_test_data(case)
                if options['verbose']:
                    print("Created", tests_created, "tests")
                    print("Tests:", list(map(lambda x: x.type, tests)))

                case.save()
                if options['verbose']:
                    print("^^ Patient data saved ^^")

            except Exception as e:
                print("Exception on case", case.document_id, e)

        print("patient_created_count", patient_created_count)
