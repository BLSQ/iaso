import logging
from typing import List
from pathlib import PurePath
from django.conf import settings
from hat.cases.models import HatCase
import hat.couchdb.api as couchdb
from hat.couchdb.utils import walk_changes
from hat.common.utils import create_shared_filename
from hat.common.mdb import get_tablenames
from .import_historic import import_historic, HISTORIC_TABLE_NAME
from .import_pv import import_pv, PV_TABLE_NAME
from .import_backup import import_backup
from hat.import_export.errors import ImportStage


logger = logging.getLogger(__name__)


def import_file(name: str, filename: str, store=False) -> dict:
    suffix = PurePath(filename).suffix.lower()

    if any(suffix in s for s in ['.mdb', '.accdb']):
        # We infer what kind of MDB file we have by the table names
        tables = get_tablenames(filename)
        if HISTORIC_TABLE_NAME in tables:
            return import_historic(name, filename, store=store)
        elif PV_TABLE_NAME in tables:
            return import_pv(name, filename, store=store)
        else:
            err_msg = 'Cannot import unkown mdb file: {}'.format(name)
            logger.error(err_msg)
            return {
                'type': 'import_error',
                'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
            }

    elif suffix in '.enc':
        return import_backup(name, filename, store=store)

    else:
        err_msg = 'Cannot import unkown filetype: {}'.format(suffix)
        logger.error(err_msg)
        return {
            'type': 'import_error',
            'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
        }


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

    HatCase.objects.all().delete()
    walk_changes(settings.COUCHDB_DB, import_change, params={'include_docs': 'true'})
    logger.info('reimport finished')
    return results
