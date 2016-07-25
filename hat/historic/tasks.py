import logging
from base64 import b64encode
from django.conf import settings
from rq.decorators import job
from hat.rq.connection import redis_conn
from .extract import extract_mdbtable_via_db
from .transform import transform_cards
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant
from hat import couchdb

logger = logging.getLogger(__name__)


@job('default', connection=redis_conn)
def import_mdbfiles(files):
    # the result will be a list of infos about file imports
    result = []
    for (name, filename) in files:
        info = {
            'type': 'mdb_import',
            'version': 1,
            'name': name,
            'total': 0,
            'num_imported': 0,
            'num_existing': 0,
            'errors': [],
        }
        try:
            logger.info('Extracting: {}...'.format(name))
            rawcards_df = extract_mdbtable_via_db(filename, 'T_CARDS')
            df = transform_cards(rawcards_df)
            ids = list(df['document_id'])
            info['total'] = len(ids)

            existing_ids = []

            if len(df) != 0:
                # remove rows with existing ids from the import
                existing_ids = HatParticipant.objects \
                                             .filter(document_id__in=ids) \
                                             .values_list('document_id', flat=True)
                info['num_existing'] = len(existing_ids)
                df2 = df[~df['document_id'].isin(existing_ids)]

                # write dataset to postgres
                table_name = HatParticipant.objects.model._meta.db_table
                with engine.begin() as conn:
                    df2.to_sql(table_name, conn, if_exists='append', index=False)
                info['num_imported'] = len(df2)
        except Exception as exc:
            info['errors'].append(str(exc))
            logger.exception(exc)

        try:
            # Every mdb file is stored in couchdb, so that we can revisit the files
            # in the case we want to extract information again or differently
            doc = info.copy()
            with open(filename, 'rb') as file:
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

    print("stats", info)
    return result


@job('default', connection=redis_conn)
def export_csv():
    import pandas
    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df = pandas.read_sql_table(table_name, conn)
    return df.to_csv()
