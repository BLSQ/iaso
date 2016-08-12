from base64 import b64encode
from pandas import DataFrame
from django.conf import settings
from hat.participants.models import HatParticipant
from hat.common.sqlalchemy import engine
from hat import couchdb
from hat.import_export.errors import handle_import_stage, ImportStage


@handle_import_stage(ImportStage.store)
def store_file(doc: dict, filename: str, mimetype: str) -> str:
    with open(filename, 'rb') as file:
        doc['_attachments'] = {
            'file': {
                'content_type': mimetype,
                'data': b64encode(file.read()).decode('ascii')
            }
        }
    r = couchdb.post(settings.COUCHDB_DB, json=doc)
    r.raise_for_status()
    return r.json()['id']


@handle_import_stage(ImportStage.load)
def load_into_db(df: DataFrame) -> DataFrame:
    '''Load the dataframe into postgres'''

    # remove rows with existing ids from the data
    ids = list(df['document_id'])
    existing_ids = HatParticipant.objects \
                                 .filter(document_id__in=ids) \
                                 .values_list('document_id', flat=True)
    df = df[~df['document_id'].isin(existing_ids)]

    if len(df) == 0:
        return df

    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df.to_sql(table_name, conn, if_exists='append', index=False)
    return df
