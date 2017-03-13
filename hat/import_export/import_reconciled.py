import logging
import pandas
from django.utils.translation import ugettext as _

from .errors import ImportStageException, ImportStage, get_import_error
from .extract import extract_reconciliation_file
from .load import load_reconciled_into_db
from .utils import hash_file, read_file_base64, capitalize
from hat.cases.event_log import EventFile, log_reconciled_file_import, reconciled_file_exists

logger = logging.getLogger(__name__)


def import_reconciled_file(orgname: str, filename: str):
    ''' Import a reconciled file with handling errors and storing the event '''
    result = {
        'typename': _('reconciled data'),
        'orgname': orgname,
        'filename': filename,
        'error': None,
        'stats': None
    }
    file_hash = hash_file(filename)
    try:
        if reconciled_file_exists(file_hash):
            err_msg = _('This file has already been uploaded: {}').format(orgname)
            raise ImportStageException(err_msg, ImportStage.exists)
        stats = import_reconciled_file_unchecked(orgname, filename)
        result['stats'] = stats

    except Exception as ex:
        logger.exception(ex)
        result['error'] = get_import_error(ex)

    else:
        file = EventFile(
            name=orgname,
            hash=file_hash,
            contents=read_file_base64(filename)
        )
        log_reconciled_file_import(stats, file)
    return result


def import_reconciled_file_unchecked(orgname: str, filename: str):
    ''' Import a reconciled file without handling errors '''
    df = extract_reconciliation_file(filename)

    df_rec = pandas.DataFrame()
    df_rec['document_id'] = df['document_id']
    if 'ZS' in df:
        df_rec['ZS'] = df['ZS'].apply(capitalize)
    if 'AS' in df:
        df_rec['AS'] = df['AS'].apply(capitalize)
    if 'Village' in df:
        df_rec['village'] = df['Village'].apply(capitalize)
    if 'Latitude' in df:
        df_rec['latitude'] = df['Latitude']
    if 'Longitude' in df:
        df_rec['longitude'] = df['Longitude']

    stats = load_reconciled_into_db(df_rec)
    return stats
