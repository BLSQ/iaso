import pandas
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant


def export_csv():
    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df = pandas.read_sql_table(table_name, conn)
    return df.to_csv()
