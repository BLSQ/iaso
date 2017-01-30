import logging
from typing import List
from pathlib import PurePath
from django.conf import settings
from hat.cases.models import Case, Location
import hat.couchdb.api as couchdb
from hat.couchdb.utils import walk_changes
from hat.common.utils import create_shared_filename
from hat.import_export.errors import ImportStage
from .import_cases import import_cases_file
from .import_locations import import_locations_file, import_locations_areas_file
from .import_reconciled import import_reconciled_file
from .import_csv import import_csv_file

logger = logging.getLogger(__name__)


def reimport() -> List[dict]:
    results = []

    def import_change(c):
        nonlocal results
        type = c['doc'].get('type', None)
        if not type == 'historic_import' and \
           not type == 'backup_import' and \
           not type == 'pv_import' and \
           not type == 'csv_import' and \
           not type == 'locations_import' and \
           not type == 'locations_areas_import' and \
           not type == 'reconciled_import':
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

        if type == 'historic_import' or \
           type == 'backup_import' or \
           type == 'pv_import':
            stats = import_cases_file(c['doc']['orgname'], filename)
        elif type == 'csv_import':
            stats = import_csv_file(c['doc']['orgname'], filename)
        elif type == 'locations_import':
            stats = import_locations_file(c['doc']['orgname'], filename)
        elif type == 'locations_areas_import':
            stats = import_locations_areas_file(c['doc']['orgname'], filename)
        elif type == 'reconciled_import':
            stats = import_reconciled_file(c['doc']['orgname'], filename)

        # Todo: remove the file after import
        results.append(stats)

    Case.objects.all().delete()
    Location.objects.all().delete()
    walk_changes(settings.COUCHDB_DB, import_change, params={'include_docs': 'true'})
    logger.info('reimport finished')
    return results
