from django.core.management.base import BaseCommand
from rq import Connection
from rq.job import Job
from hat.rq.connection import redis_conn


class Command(BaseCommand):
    '''
    Test command that gets a task by its id for development testing
    '''
    help = 'Check a test celery task'

    def add_arguments(self, parser):
        parser.add_argument('task_id', type=str)

    def handle(self, *args, **options):
        self.stdout.write('checking task: ' + options['task_id'])
        try:
            with Connection(redis_conn) as conn:
                job = Job().fetch(options['task_id'], conn)
                self.stdout.write('job: ' + job.status)
        except Exception as ex:
            self.stderr.write('Error running test task: ' + ex)
        self.stdout.write('Checked task.')
