import logging
from django.utils import timezone
from django.db import transaction
from django.utils.translation import ugettext as _

from hat.sync.utils import fetch_devicedbs_info, fetch_devicedb_data
from hat.sync.models import DeviceDB
from .errors import ImportStage, ImportStageException
from .load import load_cases_into_db
from hat.cases.event_log import EventStats, log_sync_import
from .extract_transform import IMPORT_CONFIG, extract_mobile_post, transform_source

logger = logging.getLogger(__name__)
config = IMPORT_CONFIG['sync']


def import_synced_devices(store=True) -> dict:
    # do not spend time on empty devices
    devices = [info['device'] for info in fetch_devicedbs_info() if info['num_docs'] > 0]
    return [import_synced_device(device, store) for device in devices]


@transaction.atomic
def import_synced_device(device: DeviceDB, store=True) -> dict:
    result = {
        'typename': _('synced data'),
        'errors': [],
        'stats': None,
        'device': device,
    }

    device.last_synced_log_status = None
    device.last_synced_log_message = None

    try:
        data = fetch_devicedb_data(device)
        if len(data['docs']) > 0:
            extracted = extract_mobile_post(data['docs'])
            transformed = transform_source(config, extracted, device.device_id)
            stats = load_cases_into_db(transformed)
            result['stats'] = stats
        else:
            return result

        device.last_synced_seq = data['last_seq']
        device.last_synced_log_message = '{} - {} - {} - {}'.format(
            stats.total,
            stats.created,
            stats.updated,
            stats.deleted,
        )
        device.last_synced_date = timezone.now()
        device.save()

        if store:
            log_sync_import(stats, data['docs'], device.device_id)

    except ImportStageException as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = str(exc)
        result['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = str(exc)
        result['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return result
