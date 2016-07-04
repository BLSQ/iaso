import argparse
import json
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from hat.couchdb.utils import importdocs

class Command(BaseCommand):
    help = 'Import docs to couchdb'

    def add_arguments(self, parser):
        parser.add_argument('jsonfile', type=argparse.FileType('r'))

    def handle(self, *args, **options):
        dburl = settings.COUCHDB_URL + '/' + settings.COUCHDB_DBNAME
        file = options['jsonfile']
        importdocs(dburl, json.load(file))
        self.stdout.write('Successfully imported docs.')