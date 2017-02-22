import logging
from pathlib import PurePath
from django.utils.translation import ugettext as _
from hat.common.mdb import get_tablenames
from .errors import ImportStage, ImportStageException, get_import_error
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source
from .load import load_cases_into_db
from .utils import hash_file, read_file_base64
from hat.cases.event_log import EventFile, log_cases_file_import, cases_file_exists

logger = logging.getLogger(__name__)


def import_cases_file(orgname: str, filename: str):
    ''' Import a cases file with handling errors and storing the event '''
    result = {
        'typename': None,
        'orgname': orgname,
        'filename': filename,
        'error': None,
        'stats': None
    }
    file_hash = hash_file(filename)
    try:
        if cases_file_exists(file_hash):
            err_msg = _('This file has already been uploaded: {}').format(orgname)
            raise ImportStageException(err_msg, ImportStage.exists)
        (stats, source_type) = import_cases_file_unchecked(orgname, filename)
        result['stats'] = stats
        result['typename'] = _(source_type)

    except Exception as ex:
        logger.exception(ex)
        result['error'] = get_import_error(ex)

    else:
        file = EventFile(
            name=orgname,
            hash=file_hash,
            contents=read_file_base64(filename)
        )
        log_cases_file_import(stats, file, source_type)
    return result


def import_cases_file_unchecked(orgname: str, filename: str):
    ''' Import a cases file without handling errors '''
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
            raise ImportStageException(err_msg, ImportStage.extract)
    elif suffix == '.enc':
        source_type = 'backup'
    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        raise ImportStageException(err_msg, ImportStage.filetype)

    config = IMPORT_CONFIG[source_type]
    extracted = extract_file(config, filename)
    transformed = transform_source(config, extracted, orgname)
    stats = load_cases_into_db(transformed)
    return (stats, source_type)
