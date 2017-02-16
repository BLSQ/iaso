import logging
from typing import List
from pathlib import PurePath

from hat.cases.models import Case, Location
from hat.common.utils import create_shared_filename

from .errors import ImportStage
from .import_cases import import_cases_file
from .import_csv import import_csv_file
from .import_locations import import_locations_file, import_locations_areas_file
from .import_reconciled import import_reconciled_file
from .models import ImportLog

logger = logging.getLogger(__name__)


def reimport() -> List[dict]:
    results = []

    def import_change(import_log: ImportLog):
        nonlocal results
        type = import_log.source

        # TODO:
        # type == 'sync_import'
        # type == 'merge_import'

        if not type == 'historic_import' and \
           not type == 'backup_import' and \
           not type == 'pv_import' and \
           not type == 'csv_import' and \
           not type == 'locations_import' and \
           not type == 'locations_areas_import' and \
           not type == 'reconciled_import':
            return

        # get the attached file
        if import_log.content is None:
            err_msg = 'Could not get content for file: ' + import_log.filename
            logger.error(err_msg)
            results.append({
                'type': 'import_error',
                'errors': [{'stage': ImportStage.filetype.name, 'message': err_msg}]
            })
            return

        # write the file to disk
        suffix = PurePath(import_log.filename).suffix.lower()
        filename = create_shared_filename(suffix)
        with open(filename, 'wb') as fd:
            fd.write(import_log.content)

        if type == 'historic_import' or \
           type == 'backup_import' or \
           type == 'pv_import':
            stats = import_cases_file(import_log.filename, filename)
        elif type == 'csv_import':
            stats = import_csv_file(import_log.filename, filename)
        elif type == 'locations_import':
            stats = import_locations_file(import_log.filename, filename)
        elif type == 'locations_areas_import':
            stats = import_locations_areas_file(import_log.filename, filename)
        elif type == 'reconciled_import':
            stats = import_reconciled_file(import_log.filename, filename)

        # Todo: remove the file after import
        results.append(stats)

    Case.objects.all().delete()
    Location.objects.all().delete()
    for import_log in ImportLog.objects.all():
        import_change(import_log)
    logger.info('reimport finished')
    return results
