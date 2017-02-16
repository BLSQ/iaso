import logging
from django.conf import settings
from django.utils.translation import ugettext as _
from pathlib import PurePath

import hat.couchdb.api as couchdb
from hat.common.mdb import get_tablenames
from .errors import ImportStage, ImportStageException
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source
from .load import load_cases_into_db
from .utils import hash_file, store_raw_file

logger = logging.getLogger(__name__)


def import_cases_file(orgname: str, filename: str, store=False) -> dict:

    stats_error = {
        'type': 'import_error',
        'typename': '---',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'stored': store,
        'errors': []
    }

    # skip existing files when not doing re-import
    file_hash = None
    if store:
        file_hash = hash_file(filename)
        existing = couchdb.get(settings.COUCHDB_DB + '/' + file_hash)
        if existing.status_code == 200:
            err_msg = _('This file has already been uploaded: {}').format(orgname)
            logger.error(err_msg)
            stats_error['errors'].append({'stage': ImportStage.exists.name, 'message': err_msg})
            return stats_error

    suffix = PurePath(filename).suffix.lower()
    if suffix in ['.mdb', '.accdb']:
        # We infer what kind of MDB file we have by the table names
        tables = get_tablenames(filename)
        if IMPORT_CONFIG['historic']['main_table'] in tables:
            source_type = 'historic'
        elif IMPORT_CONFIG['pv']['main_table'] in tables:
            source_type = 'pv'
        else:
            err_msg = _('Cannot import unkown mdb file: {}').format(orgname)
            logger.error(err_msg)
            stats_error['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
            return stats_error
    elif suffix == '.enc':
        source_type = 'backup'
    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        logger.error(err_msg)
        stats_error['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
        return stats_error

    stats = {
        'type': '{}_import'.format(source_type),
        'typename': _(source_type),
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'stored': store,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    config = IMPORT_CONFIG[source_type]

    try:
        extracted = extract_file(config, filename)
        transformed = transform_source(config, extracted, orgname)
        loaded = load_cases_into_db(transformed)

        stats['num_total'] = len(extracted[config['main_table']])
        stats['num_imported'] = len(loaded)

        if store:
            doc = stats.copy()
            # use file hash as id for easy lookup of existing files
            doc['_id'] = file_hash
            mimetype = 'application/x-msaccess'
            if source_type == 'backup':
                mimetype = 'application/x-encrypted'
            store_id = store_raw_file(doc, filename, mimetype)
            stats['store_id'] = store_id

    except ImportStageException as exc:
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats
