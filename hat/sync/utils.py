from .models import DeviceDB, DeviceDBEntry
from .couchdb_helpers import generate_db_name, fetch_dbs_info, fetch_devicesdb_docs


def fetch_devicesdb_info() -> list:
    dbs_info = fetch_dbs_info()
    results = []
    for device in DeviceDB.objects.all():
        dbname = generate_db_name(device.device_id)
        dbinfo = dbs_info[dbname]
        if dbname is not None:
            results.append({
                'device': device,
                'num_docs': dbinfo['doc_count'],
            })
    return results


def fetch_devicesdb_data(device: DeviceDB) -> list:
    result = fetch_devicesdb_docs(device.device_id, device.last_synced_seq)

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
