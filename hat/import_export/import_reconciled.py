import logging
import pandas
from django.db import transaction
from django.utils.translation import ugettext as _

from .errors import ImportStage
from .load import load_reconciled_into_db
from .models import ImportLog
from .utils import hash_file, extract_raw_file, capitalize

logger = logging.getLogger(__name__)


@transaction.atomic
def import_reconciled_file(orgname: str, filename: str, store=False) -> dict:

    import_log = ImportLog()
    import_log.source = 'reconciled_import'
    import_log.mimetype = 'application/x-msexcel'
    import_log.filename = orgname

    stats = {
        'typename': _('reconciled data'),
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'log': import_log,
    }

    try:
        # skip existing files when not doing re-import
        import_log.file_hash = hash_file(filename)

        if store:
            if ImportLog.objects.filter(file_hash=import_log.file_hash).exists():
                stats['errors'].append({
                    'stage': ImportStage.exists.name,
                    'message': _('This file has already been uploaded')
                })
                return stats

        df = pandas.read_excel(filename)
        import_log.num_total = len(df)

        df_rec = pandas.DataFrame()
        df_rec['document_id'] = df['document_id']
        df_rec['ZS'] = df['ZS'].apply(capitalize)
        df_rec['AS'] = df['AS'].apply(capitalize)
        df_rec['village'] = df['Village'].apply(capitalize)
        df_rec['latitude'] = df['Latitude']
        df_rec['longitude'] = df['Longitude']

        load_reconciled_into_db(df_rec)

        # We store the reconciled data so that it can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            import_log.content = extract_raw_file(filename)
            import_log.save()

    except KeyError as ke:
        stats['errors'].append({'stage': ImportStage.transform.name, 'message':  str(ke)})
        logger.exception(ke)

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats
