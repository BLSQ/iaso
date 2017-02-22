import json
from django.db import connection
from collections import namedtuple

from .queries import event_log_queries as queries

EventStats = namedtuple('EventStats', ['total', 'created', 'updated', 'deleted'])
EventFile = namedtuple('EventFile', ['name', 'hash', 'contents'])


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
    insert_event_sql = queries.insert_event(**stats._asdict())
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
    insert_event_sql = queries.insert_event(**stats._asdict())
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
    insert_event_sql = queries.insert_event(**stats._asdict())
    sql = queries.insert_cases_merge(
        insert_event=insert_event_sql,
        documents=json.dumps({'older_id': older_id, 'younger_id': younger_id})
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id


def log_sync_import(stats, docs, device_id):
    insert_event_sql = queries.insert_event(**stats._asdict())
    sql = queries.insert_cases_sync(
        insert_event=insert_event_sql,
        documents=json.dumps(docs),
        device_id=device_id
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id
