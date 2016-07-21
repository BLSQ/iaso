from os.path import basename
from rq.decorators import job
from hat.rq.connection import redis_conn
from .extract import extract_mdbtable_via_db
from .transform import transform_cards
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant


@job('default', connection=redis_conn)
def import_mdbfiles(files):
    stats = []
    for file in files:
        print('Extracting', file)
        rawcards_df = extract_mdbtable_via_db(file, 'T_CARDS')
        df = transform_cards(rawcards_df)
        ids = list(df['document_id'])
        existing_ids = []

        if len(df) != 0:
            # remove rows with existing ids from the import
            existing_ids = HatParticipant.objects \
                                         .filter(document_id__in=ids) \
                                         .values_list('document_id', flat=True)
            df = df[~df['document_id'].isin(existing_ids)]

            # write dataset to postgres
            table_name = HatParticipant.objects.model._meta.db_table
            with engine.begin() as conn:
                df.to_sql(table_name, conn, if_exists='append', index=False)

        stats.append({
            'name': basename(file),
            'total': len(ids),
            'num_imported': len(df),
            'num_existing': len(existing_ids)
        })
    return stats


@job('default', connection=redis_conn)
def export_csv():
    import pandas
    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df = pandas.read_sql_table(table_name, conn)
    return df.to_csv()
