from datetime import datetime
from django.core.management.base import BaseCommand
from rq.decorators import job
from hat.rq.connection import redis_conn


@job('default', connection=redis_conn)
def test_task(label):
    print('[from task rq] starting ' + label)
    from time import sleep
    for i in range(3):
        print('[from task rq] running... ' + label)
        sleep(10)
    print('[from task rq] done', label)
    return "TASK RESULT YO RQ"


class Command(BaseCommand):
    '''
    Test command to create a task for development testing
    '''
    help = 'Run a test huey task'

    def handle(self, *args, **options):
        try:
            r = test_task.delay('test_' + datetime.today().isoformat())
            self.stdout.write('id: ' + r.id)
        except Exception as ex:
            self.stderr.write('Error running test task: ' + ex)
        self.stdout.write('Successfully started task.')
