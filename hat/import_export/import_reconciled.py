import logging
import pandas
from django.db import transaction
from django.utils.translation import ugettext as _

from .errors import ImportStage
from .load import load_reconciled_into_db
from .utils import hash_file, extract_raw_file, capitalize
from hat.cases.event_log import EventFile, log_reconciled_file_import, reconciled_file_exists

logger = logging.getLogger(__name__)


@transaction.atomic
def import_reconciled_file(orgname: str, filename: str, store=True) -> dict:
    result = {
        'typename': _('reconciled data'),
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'stats': None
    }

    try:
        file_hash = hash=hash_file(filename)

        # skip existing files when not doing re-import
        if store and reconciled_file_exists(file_hash):
            result['errors'].append({
                'stage': ImportStage.exists.name,
                'message': _('This file has already been uploaded')
            })
            return result

        df = pandas.read_excel(filename)

        df_rec = pandas.DataFrame()
        df_rec['document_id'] = df['document_id']
        df_rec['ZS'] = df['ZS'].apply(capitalize)
        df_rec['AS'] = df['AS'].apply(capitalize)
        df_rec['village'] = df['Village'].apply(capitalize)
        df_rec['latitude'] = df['Latitude']
        df_rec['longitude'] = df['Longitude']

        stats = load_reconciled_into_db(df_rec)
        result['stats'] = stats

        # We store the reconciled data so that it can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            file = EventFile(name=orgname, hash=file_hash, contents=extract_raw_file(filename))
            log_reconciled_file_import(stats, file)

    except KeyError as ke:
        result['errors'].append({'stage': ImportStage.transform.name, 'message':  str(ke)})
        logger.exception(ke)

    except Exception as ex:
        result['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return result
