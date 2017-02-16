import logging
import pandas
from django.conf import settings
from django.utils.translation import ugettext as _

import hat.couchdb.api as couchdb
from .errors import ImportStage
from .load import load_cases_into_db
from .utils import hash_file, store_raw_file

logger = logging.getLogger(__name__)

################################################################################
# The csv import method is currently only used for testing purposes
################################################################################


def import_csv_file(orgname, filename, store=False):
    stats = {
        'type': 'csv_import',
        'typename': '***',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'stored': store,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    try:
        file_hash = None
        if store:
            file_hash = hash_file(filename)
            existing = couchdb.get(settings.COUCHDB_DB + '/' + file_hash)
            if existing.status_code == 200:
                err_msg = _('This file has already been uploaded: {}').format(orgname)
                logger.error(err_msg)
                stats['errors'].append({'stage': ImportStage.exists.name, 'message': err_msg})
                return stats

        df = pandas.read_csv(filename, sep=';')
        stats['num_total'] = len(df)
        loaded = load_cases_into_db(df)
        stats['num_imported'] = len(loaded)

        if store:
            doc = stats.copy()
            doc['_id'] = file_hash
            store_id = store_raw_file(doc, filename, 'text/csv')
            stats['store_id'] = store_id

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats
