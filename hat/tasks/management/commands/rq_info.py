from django.core.management.base import BaseCommand, CommandError
from subprocess import run, CalledProcessError


class Command(BaseCommand):
    help = 'Start the rq worker'

    def handle(self, *args, **options):
        self.stdout.write('Running rq')
        try:
            run(['rq', 'info', '-c', 'hat.settings'], check=True)
        except CalledProcessError as ex:
            self.stderr.write('Error running rq \n{}'.format(ex.output))
            raise CommandError('Error running rq')
