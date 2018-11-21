import argparse
import sys

from django.core.management.base import BaseCommand

from hat.vector.gpximport import gpximport, import_traps_from_gpx


class Command(BaseCommand):
    help = 'Import traps from gpx'

    def add_arguments(self, parser):
        parser.add_argument(
            'infile',
            metavar='input_file',
            type=argparse.FileType('r'),
            help='name of the csv file to import',
            nargs='?',
            default=sys.stdin
        )

        parser.add_argument(
            '--load',
            action='store_true',
            dest='load',
            help='Load the file right away to the Target table',
        )


    def handle(self, *args, **options):
        gpx_import = gpximport(options['infile'].name, options['infile'])

        if options['load']:
            import_traps_from_gpx(gpx_import)

        sys.stdout.write("Done importing")
