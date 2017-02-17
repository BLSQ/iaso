import logging
from django.utils import timezone
from django.db import transaction
from hat.sync.utils import fetch_devicedbs_info, fetch_devicedb_data
from hat.sync.models import DeviceDB
from .errors import ImportStage, ImportStageException
from .load import load_cases_into_db
from .extract_transform import IMPORT_CONFIG, extract_mobile_post, transform_source

logger = logging.getLogger(__name__)
config = IMPORT_CONFIG['sync']


def import_synced_devices(store=True) -> dict:
    # do not spend time on empty devices
    devices = [info['device'] for info in fetch_devicedbs_info() if info['num_docs'] > 0]
    return [import_synced_device(device, store) for device in devices]


@transaction.atomic
def import_synced_device(device: DeviceDB, store=True) -> dict:
    stats = {
        'type': 'synced_import',
        'version': 1,
        'device_id': device.device_id,
        'num_total': 0,
        'num_imported': 0,
        'last_seq': 0,
        'errors': [],
    }
    device.last_synced_log_status = None
    device.last_synced_log_message = None

    try:
        data = fetch_devicedb_data(device)
        if len(data['docs']) > 0:
            extracted = extract_mobile_post(data['docs'])
            transformed = transform_source(config, extracted, device.device_id)
            loaded = load_cases_into_db(transformed)

            stats['num_total'] = len(extracted[config['main_table']])
            stats['num_imported'] = len(loaded)

        stats['last_seq'] = data['last_seq']

        if store:
            # log sync
            device.last_synced_seq = data['last_seq']
            device.last_synced_docs = data['docs']
            device.last_synced_log_status = 'success'
            device.last_synced_log_message = '{} / {}'.format(stats['num_imported'],
                                                              stats['num_total'])
            device.last_synced_date = timezone.now()
            device.save()

    except ImportStageException as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = exc.stage.name
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = ImportStage.stage.name
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats
