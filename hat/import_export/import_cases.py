import logging
from django.db import transaction
from django.utils.translation import ugettext as _
from pathlib import PurePath

from hat.common.mdb import get_tablenames
from .errors import ImportStage, ImportStageException
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source
from .load import load_cases_into_db
from .utils import hash_file, extract_raw_file
from hat.cases.event_log import EventFile, log_cases_file_import, cases_file_exists

logger = logging.getLogger(__name__)


@transaction.atomic
def import_cases_file(orgname: str, filename: str, store=True):
    result = {
        'typename': None,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'stats': None
    }

    file_name = orgname
    file_hash = hash_file(filename)

    # skip existing files when not doing re-import
    if store and cases_file_exists(file_hash):
        err_msg = _('This file has already been uploaded: {}').format(orgname)
        logger.error(err_msg)
        result['errors'].append({'stage': ImportStage.exists.name, 'message': err_msg})
        return result

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
            result['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
            return result
    elif suffix == '.enc':
        source_type = 'backup'
    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        logger.error(err_msg)
        result['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
        return result

    result['typename'] = _(source_type)
    config = IMPORT_CONFIG[source_type]

    try:
        extracted = extract_file(config, filename)
        transformed = transform_source(config, extracted, orgname)
        stats = load_cases_into_db(transformed)
        result['stats'] = stats

        if store:
            # file.contents = extract_raw_file(filename)
            file = EventFile(name=orgname, hash=file_hash, contents=extract_raw_file(filename))
            log_cases_file_import(stats, file, source_type)

    except ImportStageException as exc:
        result['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        result['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return result
