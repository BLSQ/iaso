import logging
import pandas
from django.db import transaction
from django.utils.translation import ugettext as _

from .errors import ImportStage
from .load import load_cases_into_db
from .models import ImportLog
from .utils import hash_file, extract_raw_file

logger = logging.getLogger(__name__)

################################################################################
# The csv import method is currently only used for testing purposes
################################################################################


@transaction.atomic
def import_csv_file(orgname, filename, store=False):

    import_log = ImportLog()
    import_log.source = 'csv_import'
    import_log.mimetype = 'text/csv'
    import_log.filename = orgname

    stats = {
        'typename': '***',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'log': import_log,
    }

    try:
        import_log.file_hash = hash_file(filename)

        if store:
            if ImportLog.objects.filter(file_hash=import_log.file_hash).exists():
                err_msg = _('This file has already been uploaded: {}').format(orgname)
                logger.error(err_msg)
                stats['errors'].append({'stage': ImportStage.exists.name, 'message': err_msg})
                return stats

        df = pandas.read_csv(filename, sep=';')
        import_log.num_total = len(df)
        load_cases_into_db(df, import_log)

        if store:
            import_log.content = extract_raw_file(filename)
            import_log.save()

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats
