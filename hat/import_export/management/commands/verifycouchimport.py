import logging

from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.couchdb.utils import fetch_all_docs, fetch_doc
from hat.import_export.extract import prepare_mobile_data
from hat.import_export.import_synced import import_synced_docs
from hat.import_export.transform import transform_source
from hat.sync.models import DeviceDB, JSONDocument

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Go through the entire couchdb database, verify that the participants are in sync_jsondocument and import' \
           'them if necessary.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

        parser.add_argument(
            '--orphans',
            action='store_true',
            dest='orphans',
            help='For JSONDocuments that don\'t have a linked Case, try to reunite them. This is quite slow',
        )

    def handle(self, *args, **options):
        for device in DeviceDB.objects.all():
            try:
                print(f"************** Checking {device.device_id} ****************")
                docs = fetch_all_docs(device.db_name)
                documents_to_add = []
                for i, doc in enumerate(docs['rows']):
                    # Find the document in JSONDocument
                    db_document = JSONDocument.objects\
                        .filter(doc_id=doc['id'], doc_revision=doc['value']['rev'])\
                        .first()
                    if db_document is None:
                        # create the document
                        latest_doc = fetch_doc(dbname=device.db_name, document_id=doc['id'])
                        documents_to_add.append(latest_doc)

                        # Don't accumulate too many records to import
                        if len(documents_to_add) > 500:
                            print("Flushing 500 records to add")
                            import_synced_docs(documents_to_add, device.device_id)
                            documents_to_add = []
                    else:
                        if db_document.case_id is None and options['orphans']:
                            print(f"{i} Document {db_document.id} is missing a case_id")
                            try:
                                latest_doc = fetch_doc(dbname=device.db_name, document_id=doc['id'])
                                # Ensure that the document_id is computer the same way by following the same process:
                                extracted = prepare_mobile_data([latest_doc])
                                transformed = transform_source('sync', extracted)
                                couch_hat_doc_id = list(transformed.get('document_id'))[0]
                                found_case = Case.objects.filter(document_id=couch_hat_doc_id).order_by("-id").first()
                                if found_case:
                                    db_document.case = found_case
                                    db_document.save()
                                    print(f"Document {db_document.id} was linked to {found_case.id}")
                            except Exception as exc:
                                print("Failed to retrieve existing case", exc)
                        else:
                            if options['verbose']:
                                print(f"{i} Document {db_document.id} OK")
                            if i % 100 == 0:
                                print(f"************** {i} **************")
                if len(documents_to_add) > 0:
                    import_synced_docs(documents_to_add, device.device_id)
            except Exception as ex:
                if hasattr(ex, 'response') and ex.response.status_code == 404:
                    logger.error("Could not find CouchDB for device " + device.device_id)
                else:
                    logger.exception(str(ex))
