from django.core.management.base import BaseCommand
from ...setup import setup_couchdb


class Command(BaseCommand):
    help = 'Setup couchdb'

    def handle(self, *args, **options):
        setup_couchdb()
        self.stdout.write('Couchdb setup done.')
