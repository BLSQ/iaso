from django.core.management.base import BaseCommand

from hat.cases.models import Case


class Command(BaseCommand):
    help = 'Resave all cases with recomputed derivated fields'

    def handle(self, *args, **options):
        cases = Case.objects.all()
        counter = 0
        for case in cases:
            case.save()
            counter = counter + 1
            if counter % 1000 == 0 :
                print("Count:", counter)




