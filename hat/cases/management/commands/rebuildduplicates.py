from django.core.management.base import BaseCommand
from django.db import connection
from hat.cases.models import DuplicatesPair
from hat.queries import duplicates_queries


class Command(BaseCommand):
    help = 'Create the duplicatepairs table'

    def handle(self, *args, **options):
        import time
        t_begin = time.time()
        with connection.cursor() as cursor:
            cursor.execute(duplicates_queries.makepairs())
            t_end = time.time()

        self.stdout.write('number of pairs: {}'.format(DuplicatesPair.objects.all().count()))
        self.stdout.write('duration: {:.2f} secs'.format(t_end - t_begin))
        self.stdout.write('done.')
