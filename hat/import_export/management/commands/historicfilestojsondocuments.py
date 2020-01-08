from django.core.management.base import BaseCommand

from hat.cases.event_log import get_events, get_event_of_type, EventTable
from hat.cases.models import Case
from hat.import_export.extract import prepare_mdb_data
from hat.import_export.import_cases import save_documents
from hat.import_export.load import update_cases
from hat.import_export.transform import transform_source
from hat.sync.models import JSONDocument


class Command(BaseCommand):
    help = 'Reimport the files in file_event tables into JSONDocument'

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
                event_details = get_event_of_type(event['table_name'], event['id']) if event.get("table_name") else None
                file_hash = event_details.get("file_hash", "")
                print("Prep...", end="", flush=True)
                prepared = prepare_mdb_data(event['sub_type'], event['data'])
                print("Save documents...", end="", flush=True)
                # Do not attempt to save if it has already been
                hash_already_imported = JSONDocument.objects.filter(doc_id=f"{file_hash}-1").first()
                if event["sub_type"] == "historic" and hash_already_imported is None:
                    save_documents(prepared.get("T_CARDS"), file_hash, type="historic")
                    print("Transform documents to try and find their case...", end="", flush=True)
                    transformed = transform_source('historic', prepared)
                    for index, row in transformed.iterrows():
                        cases = Case.objects.filter(document_id=row['document_id']).filter(source='historic')
                        if cases.count() == 1:
                            JSONDocument.objects.filter(id=row["json_document_id"]).update(case_id=cases.first().id)

                print("Update...", end="", flush=True)

                print("done")
            else:
                print(event['id'], "Skipping non-{}".format(options['type']))

        print('----------- Import done -----------')
        print('updated:', num_updated)
