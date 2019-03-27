"""
Import synced cases
-------------------

The ``import_synced`` module can import cases that have been synced from the HAT mobile app.
The data are transfered to a CouchDB database on the server.
Each device will get its own database in CouchDB and will use PouchDB to
CouchDB replication to transmit data to the server.
A more detailed description can be found in the ``hat.sync`` module.
"""

import json
import logging
from typing import List

import dateutil
from django.db import transaction
from django.utils import timezone
from django.utils.translation import ugettext as _

from hat.cases.event_log import log_sync_import, EventStats
from hat.common.typing import JsonType
from hat.couchdb.utils import fetch_db_docs
from hat.geo.models import PopulationData
from hat.sync.models import DeviceDB, JSONDocument, DeviceImportEvent
from .errors import get_import_error
from .extract import prepare_mobile_data
from .load import load_cases_into_db, normalize_location
from .transform import transform_source
from .typing import ImportResult

logger = logging.getLogger(__name__)


@transaction.atomic
def import_synced_devices() -> List[ImportResult]:
    """
    Import cases data from devices sync databases.

    The devices with the HAT mobile app installed will sync cases data to CouchDB.
    This reads the latest data from the devices CouchDB databases and imports them
    into the main store.

    The returned dict list will contain information about how many records were imported
    or any errors that happened.
    """

    results = []
    for device in DeviceDB.objects.all():
        result: ImportResult = {
            'typename': _('synced data'),
            'error': None,
            'stats': None
        }
        try:
            data = fetch_db_docs(device.db_name, device.last_synced_seq)
            DeviceImportEvent(
                device=device,
                event_type=DeviceImportEvent.FETCH_COUCHDB,
                total_records=len(data),
                last_synced_seq=device.last_synced_seq,
            ).save()
            docs = data['docs']
            stats = import_synced_docs(docs, device.device_id)
            import_synced_population(docs, device.device_id)
            result['stats'] = stats
            results.append(result)
            if stats.total:
                device.last_synced_date = timezone.now()
                device.last_synced_log_status = 'success'
                device.last_synced_seq = data['last_seq']
                device.last_synced_log_message = '{} - {} - {} - {}'.format(
                    stats.total,
                    stats.created,
                    stats.updated,
                    stats.deleted,
                )
                device.save()
                DeviceImportEvent(
                    device=device,
                    event_type=DeviceImportEvent.IMPORTED,
                    total_records=stats.total,
                    created_records=stats.created,
                    updated_records=stats.updated,
                    deleted_records=stats.deleted,
                    last_synced_seq=device.last_synced_seq,
                ).save()
        except Exception as ex:
            if hasattr(ex,'response') and ex.response.status_code == 404:
                logger.error("Could not find CouchDB for device " + device.device_id)
            else:
                logger.exception(str(ex))
                result['error'] = get_import_error(ex)
                device.last_synced_log_status = str(ex)
                DeviceImportEvent(
                    device=device,
                    event_type=DeviceImportEvent.ERROR,
                    details=device.last_synced_log_status,
                    last_synced_seq=device.last_synced_seq,
                ).save()
        else:
            log_sync_import(stats, docs, device.device_id)

    return results


def import_synced_docs(docs, device_id) -> EventStats:
    device = DeviceDB.objects.get(device_id=device_id)
    patient_docs: List[dict] = [doc for doc in docs if 'type' in doc and doc['type'] == 'participant']
    for doc in patient_docs:
        logger.error(json.dumps(doc))

        revision = doc.get('_rev', None)
        doc_id = doc.get('_id', None)

        couch_document, document_created = JSONDocument.objects.get_or_create(
            doc_id=doc_id, doc_revision=revision,
            defaults={'doc': doc, 'device': device}
        )

        if couch_document.processed:
            patient_docs.remove(doc)
            continue

        doc['json_document_id'] = couch_document.id

    extracted = prepare_mobile_data(patient_docs)
    transformed = transform_source('sync', extracted)
    stats = load_cases_into_db(transformed)
    return stats


def import_synced_population(docs: JsonType, device_id: str):
    records_imported = 0
    device = DeviceDB.objects.get(device_id=device_id)
    ptr_docs: List[dict] = [doc for doc in docs if 'ptr' in doc and doc['_id'].startswith('latest-ptr-village-')]
    for doc in ptr_docs:
        revision = doc.get('_rev', None)
        doc_id = doc.get('_id', None)
        zone = doc.get('zone').get('id') if doc.get('zone').get('id') else doc.get('zone').get('name')
        area = doc.get('area').get('id') if doc.get('area').get('id') else doc.get('area').get('name')
        village = doc.get('village').get('id') if doc.get('village').get('id') else doc.get('village').get('name')

        (_, normalized_village) = normalize_location(zone, area, village, device_id)

        date_modified = dateutil.parser.parse(doc.get('dateModified'))

        couch_document, document_created = JSONDocument.objects.get_or_create(
            doc_id=doc_id, doc_revision=revision, type='ptr',
            defaults={'doc': doc, 'device': device, 'processed': False}
        )

        if not couch_document.processed:
            population, _ = PopulationData.objects.get_or_create(
                report_date__date=date_modified,
                source="device",
                type="PTR",
                device=device,
                population_year=date_modified.year,
                village=normalized_village,
                population=doc.get('ptr'),
                defaults={'report_date': date_modified},
            )

            # Village contains denormalized data about population, we need to update it
            if normalized_village.population_year != population.population_year \
                    or normalized_village.population != population.population:
                normalized_village.population = population.population
                normalized_village.population_year = population.population_year
                normalized_village.population_source = 'ptr'
                normalized_village.save()

            couch_document.processed = True
            couch_document.population = population
            couch_document.save()
            records_imported += 1
