from typing import Any, Optional, List, Tuple
from django.db import connection
from django_rq import job

from hat.import_export.dump import dump_events, load_events_dump
from hat.import_export.export_csv import export_csv
from hat.import_export.import_cases import import_cases_file
from hat.import_export.import_locations import import_locations_file, import_locations_areas_file
from hat.import_export.import_reconciled import import_reconciled_file
from hat.import_export.import_synced import import_synced_devices
from hat.import_export.reimport import reimport
from hat.import_export.typing import ImportResult
from hat.cases.event_log import EventStats


################################################################################
# upload/download
################################################################################


@job('default', timeout=15*60, result_ttl=60*60)
def export_task(**kwargs: Any) -> Optional[str]:
    '''
    Export SQL query or Django ORM Queryset task.

    (:func:`hat.import_export.export_csv.export_csv`).
    '''
    return export_csv(**kwargs)


@job('default', timeout=15*60)
def import_task(fileinfos: List[Tuple[str, str]]) -> List[ImportResult]:
    '''
    Import HAT cases files (encrypted or MDB format) task.

    (:func:`hat.import_export.import_cases.import_cases_file`).
    '''
    results = []
    for (name, filename) in fileinfos:
        results.append(import_cases_file(name, filename))
    return results


@job('default', timeout=15*60)
def import_reconciled_task(name: str, filename: str) -> ImportResult:
    '''
    Import reconciled cases file (CSV/Excel format) task.

    (:func:`hat.import_export.import_reconciled.import_reconciled_file`).
    '''
    return import_reconciled_file(name, filename)


@job('default', timeout=15*60)
def import_synced_devices_task() -> ImportResult:
    '''
    Import synced devices data task.

    (:func:`hat.import_export.import_synced.import_synced_devices`).

    .. Note:: The task is executed every hour.
    '''
    return import_synced_devices()


@job('default', timeout=15*60)
def import_locations_task(name: str, filename: str) -> ImportResult:
    '''
    Import villages file (DBF format) task.

    (:func:`hat.import_export.import_locations.import_locations_file`).
    '''
    return import_locations_file(name, filename)


@job('default', timeout=15*60)
def import_locations_areas_task(name: str, filename: str) -> ImportResult:
    '''
    Import health areas file (DBF format) task.

    (:func:`hat.import_export.import_locations.import_locations_areas_file`).
    '''
    return import_locations_areas_file(name, filename)


@job('default', timeout=120*60)
def reimport_task() -> List[EventStats]:
    '''
    Reimport task.

    (:func:`hat.import_export.reimport.reimport`).
    '''
    return reimport()


################################################################################
# events
################################################################################

@job('default', timeout=30*60)
def dump_events_task() -> str:
    '''
    Export events database dump task.

    (:func:`hat.import_export.dump.dump_events`).
    '''
    return dump_events()


@job('default', timeout=30*60)
def load_events_dump_task(filename: str) -> None:
    '''
    Restore events database dump task.

    (:func:`hat.import_export.dump.load_events_dump`).
    '''
    load_events_dump(filename)
