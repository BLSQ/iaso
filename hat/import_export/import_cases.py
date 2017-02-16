import logging
from django.db import transaction
from django.utils.translation import ugettext as _
from pathlib import PurePath

from hat.common.mdb import get_tablenames
from .errors import ImportStage, ImportStageException
from .extract_transform import IMPORT_CONFIG, extract_file, transform_source
from .load import load_cases_into_db
from .models import ImportLog
from .utils import hash_file, extract_raw_file

logger = logging.getLogger(__name__)


@transaction.atomic
def import_cases_file(orgname: str, filename: str, store=False) -> ImportLog:

    import_log = ImportLog()
    import_log.source = 'import_error'
    import_log.filename = orgname

    stats = {
        'typename': '---',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'log': import_log,
    }

    # skip existing files when not doing re-import
    import_log.file_hash = hash_file(filename)

    if store:
        if ImportLog.objects.filter(file_hash=import_log.file_hash).exists():
            err_msg = _('This file has already been uploaded: {}').format(orgname)
            logger.error(err_msg)
            stats['errors'].append({'stage': ImportStage.exists.name, 'message': err_msg})
            return stats

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
            stats['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
            return stats
    elif suffix == '.enc':
        source_type = 'backup'
    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        logger.error(err_msg)
        stats['errors'].append({'stage': ImportStage.filetype.name, 'message': err_msg})
        return stats

    import_log.source = '{}_import'.format(source_type)
    import_log.mimetype = 'application/x-msaccess'
    if source_type == 'backup':
        import_log.mimetype = 'application/x-encrypted'
    stats['typename'] = _(source_type)
    config = IMPORT_CONFIG[source_type]

    try:
        extracted = extract_file(config, filename)
        import_log.num_total = len(extracted[config['main_table']])
        transformed = transform_source(config, extracted, orgname)
        load_cases_into_db(transformed, import_log)

        if store:
            import_log.content = extract_raw_file(filename)
            import_log.save()

    except ImportStageException as exc:
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)

    return stats
