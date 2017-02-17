from hat.cases.models import Case
from hat.couchdb.utils import fetch_dbs_info, fetch_db_docs
from .models import DeviceDB


def fetch_devicedbs_info() -> list:
    dbs_info = fetch_dbs_info()
    results = []
    for device in DeviceDB.objects.all():
        dbinfo = dbs_info[device.db_name]
        if dbinfo is not None:
            results.append({
                'device': device,
                'num_docs': dbinfo['doc_count'],
                'num_cases': Case.objects.filter(device_id=device.device_id).count()
            })
    return results


def fetch_devicedb_data(device: DeviceDB) -> list:
    return fetch_db_docs(device.db_name, device.last_synced_seq)
