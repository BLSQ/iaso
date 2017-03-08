import logging
from django.utils import timezone
from django.db import transaction
from django.utils.translation import ugettext as _

from hat.couchdb.utils import fetch_db_docs
from hat.sync.models import DeviceDB
from .errors import get_import_error
from .load import load_cases_into_db
from hat.cases.event_log import log_sync_import
from .extract import prepare_mobile_data
from .transform import transform_source

logger = logging.getLogger(__name__)


@transaction.atomic
def import_synced_devices() -> dict:
    results = []
    for device in DeviceDB.objects.all():
        result = {
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
            logger.exception(ex)
            result['error'] = get_import_error(ex)
            device.last_synced_log_status = str(ex)
        else:
            log_sync_import(stats, docs, device.device_id)
            device.last_synced_log_status = 'success'
            device.last_synced_seq = data['last_seq']
            device.last_synced_log_message = '{} - {} - {} - {}'.format(
                stats.total,
                stats.created,
                stats.updated,
                stats.deleted,
            )
        results.append(result)
        device.last_synced_date = timezone.now()
        device.save()

    return results


def import_synced_docs(docs, device_id) -> dict:
    extracted = prepare_mobile_data(docs)
    transformed = transform_source('sync', extracted)
    stats = load_cases_into_db(transformed)
    return stats
