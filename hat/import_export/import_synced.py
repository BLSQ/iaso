'''
Import synced cases
-------------------

The ``import_synced`` module can import cases that have been synced from the HAT mobile app.
The data are transfered to a CouchDB database on the server.
Each device will get its own database in CouchDB and will use PouchDB to
CouchDB replication to transmit data to the server.
A more detailed description can be found in the ``hat.sync`` module.
'''

import logging
from typing import List
from django.utils import timezone
from django.db import transaction
from django.utils.translation import ugettext as _

from hat.couchdb.utils import fetch_db_docs
from hat.sync.models import DeviceDB
from .errors import get_import_error
from .load import load_cases_into_db
from hat.cases.event_log import log_sync_import, EventStats
from .extract import prepare_mobile_data
from .transform import transform_source
from .typing import ImportResult
from hat.common.typing import JsonType

logger = logging.getLogger(__name__)


@transaction.atomic
def import_synced_devices() -> List[ImportResult]:
    '''
    Import cases data from devices sync databases.

    The devices with the HAT mobile app installed will sync cases data to CouchDB.
    This reads the latest data from the devices CouchDB databases and imports them
    into the main store.

    The returned dict list will contain information about how many records were imported
    or any errors that happened.
    '''

    results = []
    for device in DeviceDB.objects.all():
        result: ImportResult = {
            'typename': _('synced data'),
            'error': None,
            'stats': None
        }
        try:
            data = fetch_db_docs(device.db_name, device.last_synced_seq)
            docs = data['docs']
            stats = import_synced_docs(docs, device.device_id)
            result['stats'] = stats
        except Exception as ex:
            logger.exception(str(ex))
            result['error'] = get_import_error(ex)
            device.last_synced_log_status = str(ex)
        else:
            log_sync_import(stats, docs, device.device_id)

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

    return results


def import_synced_docs(docs: JsonType, device_id: str) -> EventStats:
    extracted = prepare_mobile_data(docs)
    transformed = transform_source('sync', extracted)
    stats = load_cases_into_db(transformed)
    return stats
