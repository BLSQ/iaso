import argparse
import sys

from django.core.management.base import BaseCommand

from hat.vector.gpximport import gpximport


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

    def handle(self, *args, **options):
        gpximport(options['infile'].name, options['infile'])

        sys.stdout.write("Done importing")
