'''
Reimport data
-------------

This module contains the methods to reimport again all the case data from their sources.

It could happen that a new property should be included in the case schema or
that an old one was misunderstood and it should be *recalculated* again.
In that case the transform methods should be redefined and the data
*re-transformed* or *re-imported*.

'''

from typing import Dict, Any, Iterator
import time
import json
import logging
from typing import List
from pathlib import PurePath

from django.db import connection, transaction

from hat.common.utils import create_shared_filename
from .utils import write_file_base64

from .extract import extract_file_data
from .import_cases import import_cases_data
from .import_reconciled import import_reconciled_file_unchecked
from .import_synced import import_synced_docs
from hat.cases.event_log import EventStats, EventTable

logger = logging.getLogger(__name__)

EventType = Dict[str, Any]
DBCursor = Any


def write_contents_to_file(orgname: str, contents: str) -> str:
    suffix = PurePath(orgname).suffix.lower()
    filename = create_shared_filename(suffix)
    write_file_base64(filename, contents)
    return filename


def import_event(event: EventType) -> EventStats:
    # Import a event from the hat_event_view
    table = EventTable(event['table_name'])

    if table == EventTable.cases_file:
        orgname = event['name']
        source_type = event['sub_type']
        contents = event['contents']
        if contents is not None:
            # The complete file is stored in the database. This is the old
            # way we stored the data. We need to convert this to the newer
            # format where only the contents of the file are stored.
            # TODO: This code path can be removed when all the data were migrated
            id = event['id']
            logger.info('migration file contents for event with id: {}'.format(id))
            filename = write_contents_to_file(orgname, contents)
            (_, data) = extract_file_data(filename)
            with connection.cursor() as cursor:
                sql = '''
                    UPDATE {}
                    SET data = %s, contents = NULL
                    WHERE id = %s
                '''.format(table.value)
                cursor.execute(sql, [json.dumps(data), id])
        else:
            data = event['data']
        stats = import_cases_data(source_type, orgname, data)

    elif table == EventTable.reconciled_file:
        orgname = event['name']
        filename = write_contents_to_file(orgname, event['contents'])
        stats = import_reconciled_file_unchecked(orgname, filename)

    elif table == EventTable.cases_merge:
        # Not used anymore
        stats = EventStats(updated=0, deleted=0, created=0, total=0)

    elif table == EventTable.sync:
        device_id = event['name']
        stats = import_synced_docs(event['data'], device_id)

    else:
        raise KeyError('Unknown event type: ' + table.value)
    return stats


def iterate_events(cursor: DBCursor) -> Iterator[EventType]:
    # Generator function to fetch events in batches and yield one event at a time.
    # Events will be ordered by timestamp ascending. We use the timestamp of the last
    # seen event as key for where to start the next batch after.

    batch_size = 10
    # Postgres uses a special value for the lowest date possible'-infinity'
    last_stamp = '-infinity'
    done = False
    while True:
        cursor.execute('''
            SELECT * FROM hat_event_view
            WHERE stamp > %s
            ORDER BY stamp ASC
            LIMIT %s
        ''', [last_stamp, batch_size])
        columns = [col[0] for col in cursor.description]
        done = True
        # iterate over the batch until fetch returns None
        while True:
            row = cursor.fetchone()
            if row is None:
                break
            done = False
            event = dict(zip(columns, row))
            last_stamp = event['stamp']
            yield event

        # last_stamp will be None if the last batch was empty and we are at the end
        if done:
            raise StopIteration


@transaction.atomic
def reimport(delete_data: bool=True) -> List[EventStats]:
    '''
    Deletes ALL cases (``delete_data``) and
    reimports the data in the same chronological order they were successfully uploaded.

    The returned dict list will contain information about how many records were imported
    or any errors that happened.
    '''
    logger.info('starting reimport')
    try:
        start_time = time.clock()
        results = []
        with connection.cursor() as cursor:
            if delete_data:
                logger.info('deleting cases')
                cursor.execute('TRUNCATE TABLE cases_case CASCADE')

            logger.info('getting events info')
            cursor.execute('SELECT count(*), min(stamp), max(stamp) FROM hat_event_view')
            info_row = cursor.fetchone()
            logger.info('reimporting {} events from {} to {}'.format(*info_row))

            for event in iterate_events(cursor):
                log_keys = ('id', 'table_name', 'stamp',
                            'created', 'updated', 'deleted',
                            'name', 'sub_type')
                log_info = {k: v for k, v in event.items() if k in log_keys and v is not None}
                logger.info('importing event: {}'.format(log_info))

                stats = import_event(event)
                results.append(stats)

            # rebuild indices in table
            cursor.execute('REINDEX TABLE cases_case')

            end_time = time.clock()

    except Exception as ex:
        logger.exception(str(ex))
        raise ex

    logger.info('reimport finished, duration: {:.2f}'.format(end_time - start_time))
    return results
