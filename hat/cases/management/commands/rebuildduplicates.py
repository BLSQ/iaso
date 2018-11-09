from django.core.management.base import BaseCommand
from django.db.models import Max

from hat.patient.models import Patient, PatientDuplicatesView, PatientDuplicatesPair


class Command(BaseCommand):
    help = 'Create the duplicatepairs table'

    def handle(self, *args, **options):
        import time
        t_begin = time.time()

        PatientDuplicatesPair.objects.all().delete()

        max_id = Patient.objects.aggregate(Max('id'))['id__max']

        chunk = 1000
        for i in range(1, max_id, chunk):
            to_insert = []
            for dupe in PatientDuplicatesView.objects.filter(patient1_id__gte=i, patient1_id__lt=i + chunk):
                to_insert.append(PatientDuplicatesPair(
                    patient1_id=dupe.patient1_id,
                    patient2_id=dupe.patient2_id,
                    similarity_score=dupe.similarity_score,
                    algorithm=dupe.algorithm,
                ))

            PatientDuplicatesPair.objects.bulk_create(to_insert)
            if i % (chunk*50) == 0:
                print("{}/{}".format(i, max_id))
            else:
                print(".", end="", flush=True)

        t_end = time.time()

        print('number of pairs: {}'.format(PatientDuplicatesPair.objects.all().count()))
        print('duration: {:.2f} secs'.format(t_end - t_begin))
        print('done.')
