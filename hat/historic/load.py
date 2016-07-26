from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant


def load(df):
    ids = list(df['document_id'])
    # remove rows with existing ids from the data
    existing_ids = HatParticipant.objects \
                                 .filter(document_id__in=ids) \
                                 .values_list('document_id', flat=True)
    df2 = df[~df['document_id'].isin(existing_ids)]

    # write dataset to postgres
    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df2.to_sql(table_name, conn, if_exists='append', index=False)
    return df2
