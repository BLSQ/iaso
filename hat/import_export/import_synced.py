import logging
from django.utils import timezone
from django.db import transaction
from django.utils.translation import ugettext as _

from hat.sync.utils import fetch_devicedbs_info, fetch_devicedb_data
from hat.sync.models import DeviceDB
from .errors import ImportStage, ImportStageException
from .load import load_cases_into_db
from .models import ImportLog
from .extract_transform import IMPORT_CONFIG, extract_mobile_post, transform_source

logger = logging.getLogger(__name__)
config = IMPORT_CONFIG['sync']


def import_synced_devices(store=True) -> dict:
    # do not spend time on empty devices
    devices = [info['device'] for info in fetch_devicedbs_info() if info['num_docs'] > 0]
    return [import_synced_device(device, store) for device in devices]


@transaction.atomic
def import_synced_device(device: DeviceDB, store=True) -> dict:
    import_log = ImportLog()
    import_log.source = 'synced_import'
    import_log.device_id = device.device_id

    stats = {
        'typename': _('synced data'),
        'version': 1,
        'errors': [],
        'log': import_log,
        'device': device,
    }

    device.last_synced_log_status = None
    device.last_synced_log_message = None

    try:
        data = fetch_devicedb_data(device)
        if len(data['docs']) > 0:
            extracted = extract_mobile_post(data['docs'])
            import_log.num_total = len(extracted[config['main_table']])
            transformed = transform_source(config, extracted, device.device_id)
            load_cases_into_db(transformed, import_log)

        # `store` argument does not affect to save log in DeviceDB
        # because the data were already synced
        device.last_synced_seq = data['last_seq']
        device.last_synced_docs = data['docs']
        device.last_synced_log_status = 'success'
        device.last_synced_log_message = '{} - {} - {} - {}'.format(
            import_log.num_total,
            import_log.num_created,
            import_log.num_updated,
            import_log.num_deleted,
        )
        device.last_synced_date = timezone.now()
        device.save()

        if store:
            # log sync
            import_log.extra_stats = str({'last_seq': data['last_seq']})
            import_log.save()

    except ImportStageException as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = str(exc)
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        device.last_synced_log_status = 'error'
        device.last_synced_log_message = str(exc)
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats
