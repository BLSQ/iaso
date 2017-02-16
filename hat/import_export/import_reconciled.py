import logging
import pandas
from django.conf import settings
from django.utils.translation import ugettext as _

import hat.couchdb.api as couchdb
from .errors import ImportStage
from .load import load_reconciled_into_db
from .utils import hash_file, store_raw_file, capitalize

logger = logging.getLogger(__name__)


def import_reconciled_file(orgname: str, filename: str, store=False) -> dict:

    stats = {
        'type': 'reconciled_import',
        'typename': _('reconciled data'),
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }

    try:
        # skip existing files when not doing re-import
        file_hash = None
        if store:
            file_hash = hash_file(filename)
            existing = couchdb.get(settings.COUCHDB_DB + '/' + file_hash)
            if existing.status_code == 200:
                stats['errors'].append({
                    'stage': ImportStage.exists.name,
                    'message': _('This file has already been uploaded')
                })
                return stats

        df = pandas.read_excel(filename)
        stats['num_total'] = len(df)

        df_rec = pandas.DataFrame()
        df_rec['document_id'] = df['document_id']
        df_rec['ZS'] = df['ZS'].apply(capitalize)
        df_rec['AS'] = df['AS'].apply(capitalize)
        df_rec['village'] = df['Village'].apply(capitalize)
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

    except KeyError as ke:
        stats['errors'].append({'stage': ImportStage.transform.name, 'message':  str(ke)})
        logger.exception(ke)

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats
