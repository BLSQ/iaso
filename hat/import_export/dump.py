from django.conf import settings
from django.db import connection
from hat.common.utils import run_cmd, create_shared_filename
from hat.cases.event_log import EventTable

# get table names in pg_dump/restore param format
tables_params = ['-t', 'hat_event'] + [p for t in EventTable for p in ('-t', t.value)]

db_name = settings.DB_NAME
if settings.TESTING:
    db_name = 'test_' + db_name


def dump_events() -> str:
    filename = create_shared_filename('.sql')
    run_cmd(['pg_dump',
             '-v',
             '--no-owner',
             '-f', filename,
             # Use `custom` format, because it compresses
             '-F', 'custom',
             *tables_params,
             '-h', settings.DB_HOST,
             '-p', str(settings.DB_PORT),
             '-U', settings.DB_USERNAME,
             '-d', db_name],
            env={'PGPASSWORD': settings.DB_PASSWORD or ''})
    return filename


# @transaction.atomic
def load_events_dump(filename):
    '''
    Delete any events in the database and load events from dump.
    Warning: If this fails somewhere after the events have been
             deleted, the data is not recoverable.
    '''
    with connection.cursor() as cursor:
        cursor.execute('TRUNCATE hat_event CASCADE')
        run_cmd(['pg_restore',
                 '--exit-on-error',
                 *tables_params,
                 '--data-only',
                 '-h', settings.DB_HOST,
                 '-p', str(settings.DB_PORT),
                 '-U', settings.DB_USERNAME,
                 '-d', db_name,
                 filename],
                env={'PGPASSWORD': settings.DB_PASSWORD or ''})
