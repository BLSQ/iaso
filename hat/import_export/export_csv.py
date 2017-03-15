from typing import Optional
from django.conf import settings
from django.db import connection
from django.db.models.query import QuerySet
from hat.common.utils import run_cmd, create_shared_filename
from hat.queries import export_queries


def export_csv(sql_sentence: str=None,
               queryset: QuerySet=None,
               sep: str=',') -> Optional[str]:
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

    run_cmd(['psql',
             '-v', 'ON_ERROR_STOP=1',
             '-h', settings.DB_HOST,
             '-p', str(settings.DB_PORT),
             '-U', settings.DB_USERNAME,
             '-d', db_name],
            input=bytes(sql, 'UTF8'),
            env={'PGPASSWORD': settings.DB_PASSWORD or ''})

    return filename
