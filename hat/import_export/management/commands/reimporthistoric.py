from django.core.management.base import BaseCommand

from hat.cases.event_log import get_events
from hat.import_export.extract import prepare_mdb_data
from hat.import_export.load import update_cases
from hat.import_export.transform import transform_source


class Command(BaseCommand):
    help = 'Reimport the historical (or pv) data from file import events. Mainly after a change in the data mapping.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            action='store',
            dest='type',
            default='historic',
            help='type of data to reimport, pv or historic mainly',
        )
        parser.add_argument(
            '--filename',
            action='store',
            dest='filename',
            default=None,
            help='part of the filename to consider',
        )
        parser.add_argument(
            '--start',
            action='store',
            dest='start',
            default=None,
            help='ID of the file to start',
        )

    def handle(self, *args, **options):
        all_events = get_events(filename=options.get("filename", None), start=options.get("start", None),
                                type=options['type'] if options['type'] != 'all' else None)
        num_updated = 0
        for event in all_events:
            if event['sub_type'] == options['type'] or options['type'] == 'all':
                print(event['id'], event['name'], event['total'], event['created'], event['updated'], event['deleted'])
                print("Prep...", end="", flush=True)
                prepared = prepare_mdb_data(event['sub_type'], event['data'])
                print("Transform...", end="", flush=True)
                transformed = transform_source(event['sub_type'], prepared)
                print("Update...", end="", flush=True)
                num_updated += update_cases(transformed)
                print("done")
            else:
                print(event['id'], "Skipping non-{}".format(options['type']))

        print('----------- Import done -----------')
        print('updated:', num_updated)
