import json
from enum import Enum
from django.db import connection
from collections import namedtuple

from .queries import event_log_queries as queries

EventStats = namedtuple('EventStats', ['total', 'created', 'updated', 'deleted'])
EventFile = namedtuple('EventFile', ['name', 'hash', 'contents'])


class EventTable(Enum):
    ''' The table names of the database event tables which are also used as event types '''
    cases_file = 'hat_import_cases_file_event'
    reconciled_file = 'hat_import_reconciled_file_event'
    cases_merge = 'hat_merge_cases_event'
    sync = 'hat_sync_cases_event'


# TODO: When psycopg2 2.7 is released, use it's sql module to compose sql strings, e.g:
# from psycopg2 import sql
# 'SELECT * FROM {}'.format(sql.Identifier(table_name))


def get_events():
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM hat_event_view')
        columns = [col[0] for col in cursor.description]
        events = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return events


def get_event_of_type(table_type, id):
    with connection.cursor() as cursor:
        sql = '''
            SELECT *
            FROM (SELECT * FROM {} WHERE id = %s) a
            JOIN hat_event b ON a.id = b.id
        '''.format(table_type.value)
        cursor.execute(sql, [id])
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, cursor.fetchone()))


def cases_file_exists(file_hash):
    with connection.cursor() as cursor:
        sql = queries.cases_file_by_hash(file_hash=file_hash)
        cursor.execute(sql)
        r = cursor.fetchone()
        return r is not None


def reconciled_file_exists(file_hash):
    with connection.cursor() as cursor:
        sql = queries.reconciled_file_by_hash(file_hash=file_hash)
        cursor.execute(sql)
        r = cursor.fetchone()
        return r is not None


def log_cases_file_import(stats: EventStats, file: EventFile, source_type: str) -> int:
    insert_event_sql = queries.insert_event(
        **stats._asdict(), table_name=EventTable.cases_file.value)
    sql = queries.insert_cases_file_import(
        insert_event=insert_event_sql,
        **file._asdict(),
        source_type=source_type
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id


def log_reconciled_file_import(stats: EventStats, file: EventFile) -> int:
    insert_event_sql = queries.insert_event(
        **stats._asdict(), table_name=EventTable.reconciled_file.value)
    sql = queries.insert_reconciled_file_import(
        insert_event=insert_event_sql,
        **file._asdict()
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id


def log_cases_merge(older_id, younger_id):
    stats = EventStats(
        created=0,
        updated=1,
        deleted=1,
        total=0
    )
    insert_event_sql = queries.insert_event(
        **stats._asdict(), table_name=EventTable.cases_merge.value)
    sql = queries.insert_cases_merge(
        insert_event=insert_event_sql,
        documents=json.dumps({'older_id': older_id, 'younger_id': younger_id})
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id


def log_sync_import(stats, docs, device_id):
    insert_event_sql = queries.insert_event(
        **stats._asdict(), table_name=EventTable.sync.value)
    sql = queries.insert_cases_sync(
        insert_event=insert_event_sql,
        documents=json.dumps(docs),
        device_id=device_id
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id
