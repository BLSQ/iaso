'''
Export data
-----------

Any data from a query can be exported as csv.
The query can be specified as SQL or as a Django ORM Queryset.
The actual export is run via the postgres client ``psql`` in another process.
Using ``psql`` is many times faster then the Django ORM and allows us to user any
SQL selection as export query. Currently only cases data are exported.
'''

from typing import Optional
from django.conf import settings
from django.db import connection
from django.db.models.query import QuerySet
from hat.common.utils import run_cmd, create_shared_filename
from hat.queries import export_queries


def export_csv(sql_sentence: str=None,
               queryset: QuerySet=None,
               sep: str=',') -> Optional[str]:
    '''
    Exports any SQL query or Django ORM Queryset as an CSV file.

    The returned string indicates the file address that will contain the data.
    '''

    if not sql_sentence and queryset:
        sql, params = queryset.query.sql_with_params()
        with connection.cursor() as cursor:
            sql_sentence = cursor.mogrify(sql, params).decode('utf-8')

    if not sql_sentence:
        return None

    filename = create_shared_filename('.csv')

    db_name = settings.DB_NAME
    if settings.TESTING:
        db_name = 'test_' + db_name

    sql_context = {
        'sql_sentence': sql_sentence,
        'filename': filename,
        'delimiter': sep,
    }
    sql = export_queries.export(**sql_context)

    # the last `psql` version complains against line-endings ¯\_(ツ)_/¯
    sql = sql.replace('\n', '')

    run_cmd(['psql',
             '-v', 'ON_ERROR_STOP=1',
             '-h', settings.DB_HOST,
             '-p', str(settings.DB_PORT),
             '-U', settings.DB_USERNAME,
             '-d', db_name],
            input=bytes(sql, 'UTF8'),
            env={'PGPASSWORD': settings.DB_PASSWORD or ''})

    return filename
