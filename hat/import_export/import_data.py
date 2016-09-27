import logging
from hashlib import md5
from typing import List
from pathlib import PurePath
from django.conf import settings
from hat.cases.models import Case
import hat.couchdb.api as couchdb
from hat.couchdb.utils import walk_changes
from hat.common.utils import create_shared_filename
from hat.common.mdb import get_tablenames
from hat.import_export.errors import ImportStageException
from .load import load_into_db, store_file
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source

from hat.import_export.errors import ImportStage

logger = logging.getLogger(__name__)


def import_file(orgname: str, filename: str, store=False) -> dict:

    # skip existing files when not doing re-import
    if store:
        hasher = md5()

        with open(filename, 'rb') as file:
            hasher.update(file.read())

        file_hash = hasher.hexdigest()
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
    else:
        file_hash = ''

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
        loaded = load_into_db(transformed)

        stats['num_total'] = len(extracted[config['main_table']])
        stats['num_imported'] = len(loaded)

        if store:
            doc = stats.copy()
            # use file hash as id for easy lookup of existing files
            if file_hash:
                doc['_id'] = file_hash
            store_id = store_file(doc, filename, 'application/x-msaccess')
            stats['store_id'] = store_id

    except ImportStageException as exc:
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats


def reimport() -> List[dict]:
    results = []

    def import_change(c):
        nonlocal results
        type = c['doc'].get('type', None)
        if not type == 'historic_import' and \
           not type == 'backup_import' and \
           not type == 'pv_import':
            return

        # get the attached file
        r = couchdb.get(settings.COUCHDB_DB + '/' + c['id'] + '/file')
        if r.status_code >= 400:
            err_msg = 'Could not get attachement for doc id: ' + id
            logger.error(err_msg)
            results.append({
                'type': 'import_error',
                'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
            })
            return

        # write the file to disk
        suffix = PurePath(c['doc']['filename']).suffix.lower()
        filename = create_shared_filename(suffix)
        chunk_size = 4096
        with open(filename, 'wb') as fd:
            for chunk in r.iter_content(chunk_size):
                fd.write(chunk)

        stats = import_file(c['doc']['orgname'], filename)
        results.append(stats)

    Case.objects.all().delete()
    walk_changes(settings.COUCHDB_DB, import_change, params={'include_docs': 'true'})
    logger.info('reimport finished')
    return results
