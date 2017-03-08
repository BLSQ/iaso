import logging
from django.utils.translation import ugettext as _
from .errors import ImportStage, ImportStageException, get_import_error
from .extract import extract_file_data, prepare_mdb_data, prepare_mobile_data
from .transform import transform_source
from .load import load_cases_into_db
from .utils import hash_file
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

        (source_type, data) = extract_file_data(filename)
        stats = import_cases_data(source_type, orgname, data)
        result['stats'] = stats
        result['typename'] = _(source_type)

    except Exception as ex:
        logger.exception(ex)
        result['error'] = get_import_error(ex)

    else:
        file = EventFile(
            name=orgname,
            hash=file_hash,
            contents=data
        )
        log_cases_file_import(stats, file, source_type)
    return result


def import_historic_data(orgname, tables):
    extracted = prepare_mdb_data('historic', tables)
    transformed = transform_source('historic', extracted)

    # The name of uploaded historic files should contain
    # the entry_name and we parse it from the filename.
    parts = orgname.split('-')
    parts.pop()
    entry_name = ' '.join(parts)
    transformed['entry_name'] = entry_name
    return load_cases_into_db(transformed)


def import_pv_data(tables):
    extracted = prepare_mdb_data('pv', tables)
    transformed = transform_source('pv', extracted)
    return load_cases_into_db(transformed)


def import_backup_data(docs):
    extracted = prepare_mobile_data(docs)
    transformed = transform_source('backup', extracted)
    return load_cases_into_db(transformed)


def import_cases_data(source_type, orgname, data):
    if source_type == 'historic':
        return import_historic_data(orgname, data)
    elif source_type == 'pv':
        return import_pv_data(data)
    elif source_type == 'backup':
        return import_backup_data(data)
