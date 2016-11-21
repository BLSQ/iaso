import logging
from pathlib import PurePath
from django.conf import settings
import hat.couchdb.api as couchdb
from hat.common.mdb import get_tablenames
from hat.import_export.errors import ImportStageException
from .load import load_cases_into_db
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source
from hat.import_export.errors import ImportStage
from .utils import hash_file, store_raw_file

logger = logging.getLogger(__name__)


def import_cases_file(orgname: str, filename: str, store=False) -> dict:

    # skip existing files when not doing re-import
    file_hash = None
    if store:
        file_hash = hash_file(filename)
        existing = couchdb.get(settings.COUCHDB_DB + '/' + file_hash)
        if existing.status_code == 200:
            return {
                'orgname': orgname,
                'type': 'import_error',
                'errors': [{
                    'stage': ImportStage.exists.name,
                    'message': 'This file has already been imported'
                }]
            }

    suffix = PurePath(filename).suffix.lower()
    if suffix in ['.mdb', '.accdb']:
        # We infer what kind of MDB file we have by the table names
        tables = get_tablenames(filename)
        if IMPORT_CONFIG['historic']['main_table'] in tables:
            source_type = 'historic'
        elif IMPORT_CONFIG['pv']['main_table'] in tables:
            source_type = 'pv'
        else:
            err_msg = 'Cannot import unkown mdb file: {}'.format(orgname)
            logger.error(err_msg)
            return {
                'type': 'import_error',
                'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
            }
    elif suffix == '.enc':
        source_type = 'backup'
    else:
        err_msg = 'Cannot import unkown filetype: {}'.format(suffix)
        logger.error(err_msg)
        return {
            'type': 'import_error',
            'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
        }

    stats = {
        'type': '{}_import'.format(source_type),
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
            store_id = store_raw_file(doc, filename, 'application/x-msaccess')
            stats['store_id'] = store_id

    except ImportStageException as exc:
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats
