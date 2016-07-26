import logging
from base64 import b64encode
from django.conf import settings
from rq.decorators import job
from hat.rq.connection import redis_conn
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant
from hat import couchdb
from .extract import extract
from .transform import transform
from .load import load

logger = logging.getLogger(__name__)


@job('default', connection=redis_conn)
def import_mdbfiles(files):
    # the result will be a list of stats of imports
    result = []
    for (name, mdbfile) in files:
        info = {
            'type': 'mdb_import',
            'version': 1,
            'name': name,
            'num_total': 0,
            'num_imported': 0,
            'errors': [],
        }
        try:
            logger.info('Extracting: {}...'.format(name))
            extracted = extract(mdbfile)
            transformed = transform(extracted)
            total = len(transformed)
            info['num_total'] = total
            if total > 0:
                loaded = load(transformed)
                info['num_imported'] = len(loaded)
        except Exception as exc:
            info['errors'].append(str(exc))
            logger.exception(exc)

        try:
            # Every mdb file is stored in couchdb, so that we can revisit the files
            # in the case we want to extract information again or differently
            doc = info.copy()
            with open(mdbfile, 'rb') as file:
                doc['_attachments'] = {
                    'mdb_file': {
                        'content_type': 'application/x-msaccess',
                        'data': b64encode(file.read()).decode('ascii')
                    }
                }
                couchdb.post(settings.COUCHDB_DB, json=doc)
        except Exception as exc:
            info['errors'].append(str(exc))
            logger.exception(exc)

        result.append(info)

    return result


@job('default', connection=redis_conn)
def export_csv():
    import pandas
    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df = pandas.read_sql_table(table_name, conn)
    return df.to_csv()
