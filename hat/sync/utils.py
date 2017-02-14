from .models import DeviceDB, DeviceDBEntry
from hat.couchdb.utils import fetch_dbs_info, fetch_db_docs


def fetch_devicedbs_info() -> list:
    dbs_info = fetch_dbs_info()
    results = []
    for device in DeviceDB.objects.all():
        dbinfo = dbs_info[device.db_name]
        if dbinfo is not None:
            results.append({
                'device': device,
                'num_docs': dbinfo['doc_count'],
                'num_cases': DeviceDBEntry.objects.filter(device_id=device.device_id).count()
            })
    return results


def fetch_devicedb_data(device: DeviceDB) -> list:
    result = fetch_db_docs(device.db_name, device.last_synced_seq)

    # compare couchdb with postgresql entries
    entries = []
    docs = []

    for doc in result['docs']:
        entry = DeviceDBEntry.objects.all() \
            .filter(device_id=device.device_id, device_doc_id=doc['_id']) \
            .first()
        if entry is None:  # new
            docs.append(doc)
            entry = DeviceDBEntry(device_id=device.device_id)
            entry.device_doc_id = doc['_id']
            entry.device_doc_rev = doc['_rev']
            entries.append(entry)
        elif entry.device_doc_rev != doc['_rev']:
            # updated
            docs.append(doc)
            entry.device_doc_rev = doc['_rev']
            entries.append(entry)

    return {
        'docs': docs,
        'entries': entries,
        'last_seq': result['last_seq'],
    }
