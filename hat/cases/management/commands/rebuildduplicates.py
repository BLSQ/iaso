from django.core.management.base import BaseCommand
from django.db.models import Max

from hat.patient.duplicates import create_potential_duplicates_for_patient_range
from hat.patient.models import Patient, PatientDuplicatesView, PatientDuplicatesPair


class Command(BaseCommand):
    help = 'Create the patientduplicatepairs table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            dest='clean',
            help='Erase the duplicates table first',
        )

        parser.add_argument(
            '--algorithm',
            action='store',
            dest='algorithm',
            help='act on a specific algorithm, defaults to all',
        )

        parser.add_argument(
            '--chunk',
            action='store',
            dest='chunk',
            help='number of rows to query at once, defaults to 1000',
        )

        parser.add_argument(
            '--start',
            action='store',
            dest='start',
            help='Starting patient id to check, default will use the most recent patient2_id',
        )

    def handle(self, *args, **options):
        import time
        t_begin = time.time()
        if options['algorithm'] and options['algorithm'] != 'all':
            queryset = PatientDuplicatesPair.objects.filter(algorithm=options['algorithm'])
        else:
            queryset = PatientDuplicatesPair.objects.all()

        if options['clean']:
            queryset.delete()
            min_id = 1
        else:
            min_id = PatientDuplicatesPair.objects.aggregate(Max('patient2_id'))['patient2_id__max']

        if options['start']:
            min_id = int(options['start'])

        max_id = Patient.objects.aggregate(Max('id'))['id__max']

        chunk = int(options['chunk']) if options['chunk'] else 1000

        total_created = 0
        for i in range(min_id, max_id, chunk):
            amount_created = create_potential_duplicates_for_patient_range(i, i + chunk)
            total_created += amount_created
            self.stdout.write("\r\x1b[KProgress: {}/{} pairs: {}/{}".format(i, max_id, amount_created, total_created),
                              ending="")
            self.stdout.flush()

        t_end = time.time()

        self.stdout.write('number of pairs: {}'.format(PatientDuplicatesPair.objects.all().count()))
        self.stdout.write('duration: {:.2f} secs'.format(t_end - t_begin))
        self.stdout.write('done.')
