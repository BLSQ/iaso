import logging

from django.core.management.base import BaseCommand

from hat.couchdb.utils import fetch_all_docs, fetch_doc
from hat.import_export.import_synced import import_synced_docs
from hat.sync.models import DeviceDB, JSONDocument

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Go through the entire couchdb database, verify that the participants are in sync_jsondocument and import' \
           'them if necessary.'

    def handle(self, *args, **options):
        for device in DeviceDB.objects.all():
            try:
                docs = fetch_all_docs(device.db_name)
                documents_to_add = []
                for doc in docs['rows']:
                    # Find the document in JSONDocument
                    db_document = JSONDocument.objects\
                        .filter(doc_id=doc['id'], doc_revision=doc['value']['rev'])\
                        .first()
                    if db_document is None:
                        # create the document
                        latest_doc = fetch_doc(dbname=device.db_name, document_id=doc['id'])
                        documents_to_add.append(latest_doc)
                    else:
                        if db_document.case_id is None:
                            print(f"Document {db_document.id} is missing a case_id")
                        else:
                            print(f"Document {db_document.id} OK")
                if len(documents_to_add) > 0:
                    import_synced_docs(documents_to_add, device.device_id)
            except Exception as ex:
                if hasattr(ex, 'response') and ex.response.status_code == 404:
                    logger.error("Could not find CouchDB for device " + device.device_id)
                else:
                    logger.exception(str(ex))
