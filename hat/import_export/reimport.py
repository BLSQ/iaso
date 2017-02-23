import logging
from typing import List
from pathlib import PurePath

from django.db import connection, transaction

from hat.cases.models import Case
from hat.common.utils import create_shared_filename
from .utils import write_file_base64

from .import_cases import import_cases_file_unchecked
from .import_reconciled import import_reconciled_file_unchecked
from .import_synced import import_synced_docs
from hat.cases.duplicates import merge_cases_by_ids
from hat.cases.event_log import EventStats, EventTable

logger = logging.getLogger(__name__)


def write_contents_to_file(orgname, contents):
    suffix = PurePath(orgname).suffix.lower()
    filename = create_shared_filename(suffix)
    write_file_base64(filename, contents)
    return filename


def import_event(event):
    ''' Import a event from the hat_event_view '''
    table = EventTable(event['table_name'])

    if table == EventTable.cases_file:
        orgname = event['name']
        filename = write_contents_to_file(orgname, event['contents'])
        (stats, source_type) = import_cases_file_unchecked(orgname, filename)

    elif table == EventTable.reconciled_file:
        orgname = event['name']
        filename = write_contents_to_file(orgname, event['contents'])
        stats = import_reconciled_file_unchecked(orgname, filename)

    elif table == EventTable.cases_merge:
        documents = event['documents']
        merge_cases_by_ids(documents['older_id'], documents['younger_id'])
        stats = EventStats(updated=1, deleted=1, created=0, total=0)

    elif table == EventTable.sync:
        device_id = event['name']
        stats = import_synced_docs(event['documents'], device_id)

    else:
        raise KeyError('Unknown event type: ' + table.value)
    return stats


@transaction.atomic
def reimport(delete_data=True) -> List[dict]:
    logger.info('starting reimport')

    if delete_data:
        Case.objects.all().delete()

    results = []
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM hat_event_view')
        columns = [col[0] for col in cursor.description]
        while True:
            event_row = cursor.fetchone()
            if event_row is None:
                break
            event = dict(zip(columns, event_row))
            stats = import_event(event)
            results.append(stats)

    logger.info('reimport finished')
    return results
