from django.core.management.base import BaseCommand
from django.conf import settings
from rq import Worker, Connection
from hat.rq import redis_conn


class Command(BaseCommand):
    help = 'Start the rq worker'

    def handle(self, *args, **options):
        self.stdout.write('Starting rq worker')
        try:
            with Connection(redis_conn):
                w = Worker(settings.QUEUES)
                w.work(logging_level=settings.LOGGING_LEVEL)
        except Exception as ex:
            self.stderr.write('Error in rq worker: ' + ex)
