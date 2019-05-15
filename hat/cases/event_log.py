from typing import NamedTuple, List, Union, Optional
import json
from enum import Enum
from django.db import connection
from collections import OrderedDict
from snaql.convertors import guard_string
from hat.common.typing import JsonType
from hat.queries import event_log_queries as queries


class EventStats(NamedTuple):
    total: int
    created: int
    updated: int
    deleted: int


class EventFile(NamedTuple):
    name: str
    hash: str
    contents: Union[str, JsonType]


class EventTable(Enum):
    ''' The table names of the database event tables which are also used as event types '''
    cases_file = 'hat_import_cases_file_event'
    reconciled_file = 'hat_import_reconciled_file_event'
    cases_merge = 'hat_merge_cases_event'
    sync = 'hat_sync_cases_event'


# TODO: When psycopg2 2.7 is released, use it's sql module to compose sql strings, e.g:
# from psycopg2 import sql
# 'SELECT * FROM {}'.format(sql.Identifier(table_name))


def get_events(filename=None, start=None, type=None) -> List[JsonType]:
    with connection.cursor() as cursor:
        query = 'SELECT * FROM hat_event_view where 1=1'
        query_params = []
        if filename is not None and len(filename) >= 3:
            query += " AND name ilike %s"
            query_params.append("%" + filename + "%")
        if start is not None:
            query += " and id >= %s"
            query_params.append(start)
        if type is not None:
            query += " and sub_type = %s"
            query_params.append(type)
        cursor.execute(query, query_params)
        columns = [col[0] for col in cursor.description]
        events = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return events


def get_event_of_type(table_type: EventTable, id: int) -> JsonType:
    with connection.cursor() as cursor:
        # Join the row from the main event table and the specific event table
        sql = '''
            SELECT *
            FROM hat_event a, {} b
            WHERE a.id = %s AND b.id = %s
        '''.format(table_type.value)
        cursor.execute(sql, [id, id])
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, cursor.fetchone()))


def cases_file_exists(file_hash: str) -> bool:
    with connection.cursor() as cursor:
        sql = queries.cases_file_by_hash(file_hash=file_hash)
        cursor.execute(sql)
        r = cursor.fetchone()
        return r is not None


def reconciled_file_exists(file_hash: str) -> bool:
    with connection.cursor() as cursor:
        sql = queries.reconciled_file_by_hash(file_hash=file_hash)
        cursor.execute(sql)
        r = cursor.fetchone()
        return r is not None


def log_event(stats: EventStats,
              event_table: EventTable,
              event_data: OrderedDict) -> Optional[int]:
    ''' Create a log entry for an event. We only want to log events when they
        changed any data and return `None` in case the event did not. For This
        to work it is important that correct `EventStats` are provided.
    '''
    # Check if anything was changed
    if stats.created == 0 and stats.updated == 0 and stats.deleted == 0 and stats.total == 0:
        return None
    # Quote and join fields and join values
    fields = ','.join(['"{}"'.format(k) for k in event_data.keys()])
    values = ','.join(event_data.values())
    sql = queries.insert_event(
        **stats._asdict(),
        details_table=event_table.value,
        details_fields=fields,
        details_values=values,
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        id = cursor.fetchone()[0]
        return id


def log_cases_file_import(stats: EventStats, file: EventFile, source_type: str) -> Optional[int]:
    event_data = OrderedDict([
        ('filename', guard_string(file.name)),
        ('file_hash', guard_string(file.hash)),
        # We do not `guard_string` the data, because
        # it would escape the quotes in the json string
        ('data', "$jsontoken${}$jsontoken$".format(json.dumps(file.contents))),
        ('source_type', guard_string(source_type))
    ])
    return log_event(stats, EventTable.cases_file, event_data)


def log_reconciled_file_import(stats: EventStats, file: EventFile) -> Optional[int]:
    event_data = OrderedDict([
        ('filename', guard_string(file.name)),
        ('file_hash', guard_string(file.hash)),
        ('contents', guard_string(file.contents))
    ])
    return log_event(stats, EventTable.reconciled_file, event_data)


def log_cases_merge(older_id: str, younger_id: str) -> Optional[int]:
    stats = EventStats(
        created=0,
        updated=1,
        deleted=1,
        total=0
    )
    documents = json.dumps({
        'older_id': older_id,
        'younger_id': younger_id,
    })
    event_data = OrderedDict([
        # We do not `guard_string` the data, because
        # it would escape the quotes in the json string
        ('documents', "$jsontoken${}$jsontoken$".format(documents)),
    ])
    return log_event(stats, EventTable.cases_merge, event_data)


def log_sync_import(stats: EventStats, docs: dict, device_id: str) -> Optional[int]:
    documents = json.dumps(docs)
    event_data = OrderedDict([
        # We do not `guard_string` the data, because
        # it would escape the quotes in the json string
        ('documents', "$jsontoken${}$jsontoken$".format(documents)),
        ('device_id', guard_string(device_id)),
    ])
    return log_event(stats, EventTable.sync, event_data)
