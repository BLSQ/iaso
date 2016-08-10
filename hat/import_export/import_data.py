import logging
from typing import List
from pathlib import PurePath
from .import_historic import import_historic
from .import_backup import import_backup
import hat.import_export.errors as errors

from django.conf import settings
from hat.participants.models import HatParticipant
import hat.couchdb as couchdb
from hat.common.utils import create_shared_filename

logger = logging.getLogger(__name__)


def import_file(name: str, filename: str, store=False) -> dict:
    suffix = PurePath(filename).suffix.lower()
    if any(suffix in s for s in ['.mdb', '.accdb']):
        return import_historic(name, filename, store=store)
    elif suffix in '.enc':
        return import_backup(name, filename, store=store)
    else:
        err_msg = 'Cannot import unkown filetype: {}'.format(suffix)
        logger.error(err_msg)
        return {
            'type': 'import_error',
            'errors': [{'origin': errors.FILETYPE, 'message': err_msg}]
        }


def reimport() -> List[dict]:
    results = []

    def import_change(c):
        nonlocal results
        type = c['doc'].get('type', None)
        if not type == 'historic_import' and not type == 'backup_import':
            return

        logger.info('reimporting: ' + c['doc']['orgname'])

        # get the attached file
        r = couchdb.get(settings.COUCHDB_DB + '/' + c['id'] + '/file')
        if r.status_code >= 400:
            err_msg = 'Could not get attachement for doc id: ' + id
            logger.error(err_msg)
            results.append({
                'type': 'import_error',
                'errors': [{'origin': errors.FILETYPE, 'message': err_msg}]
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

    HatParticipant.objects.all().delete()
    couchdb.walk_changes(settings.COUCHDB_DB, import_change, params={'include_docs': 'true'})
    logger.info('reimport finished')
    return results
