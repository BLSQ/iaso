import logging
import pandas
from django.conf import settings
import hat.couchdb.api as couchdb
from .load import load_reconciled_into_db
from .utils import hash_file, store_raw_file, transform_location_name

logger = logging.getLogger(__name__)


def import_reconciled_file(orgname: str, filename: str, store=False) -> dict:
    stats = {
        'type': 'reconciled_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'success': True,
        'num_total': 0,
        'num_imported': 0,
        'error': None
    }
    try:
        # skip existing files when not doing re-import
        file_hash = None
        if store:
            file_hash = hash_file(filename)
            existing = couchdb.get(settings.COUCHDB_DB + '/' + file_hash)
            if existing.status_code == 200:
                raise FileExistsError('File has already been uploaded')

        df = pandas.read_excel(filename)
        stats['num_total'] = len(df)

        df_rec = pandas.DataFrame()
        df_rec['document_id'] = df['document_id']
        df_rec['ZS'] = df['ZS'].apply(transform_location_name)
        df_rec['AZ'] = df['AS'].apply(transform_location_name)
        df_rec['village'] = df['Village'].apply(transform_location_name)
        df_rec['latitude'] = df['Latitude']
        df_rec['longitude'] = df['Longitude']

        num_imported = load_reconciled_into_db(df_rec)
        stats['num_imported'] = num_imported

        # We store the reconciled data so that it can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            doc = stats.copy()
            doc['_id'] = file_hash
            store_id = store_raw_file(doc, filename, 'application/x-msexcel')
            stats['store_id'] = store_id

    except Exception as ex:
        stats['success'] = False
        stats['error'] = str(ex)
        logger.exception(ex)

    return stats
