from django.db import connection
from django_rq import job
from typing import List, Tuple

from hat.queries import duplicates_queries
from hat.import_export.export_csv import export_csv
from hat.import_export.import_cases import import_cases_file
from hat.import_export.import_locations import import_locations_file, import_locations_areas_file
from hat.import_export.import_reconciled import import_reconciled_file
from hat.import_export.import_synced import import_synced_devices
from hat.import_export.reimport import reimport


################################################################################
# upload/download
################################################################################

@job('default', timeout=15*60)
def import_task(fileinfos: List[Tuple[str, str]]) -> dict:
    results = []
    for (name, filename) in fileinfos:
        results.append(import_cases_file(name, filename))
    return results


@job('default', timeout=15*60, result_ttl=60*60)
def export_task(**kwargs) -> str:
    return export_csv(**kwargs)


@job('default', timeout=30*60)
def reimport_task() -> dict:
    return reimport()


@job('default', timeout=15*60)
def import_locations_task(name, filename) -> dict:
    return import_locations_file(name, filename)


@job('default', timeout=15*60)
def import_locations_areas_task(name, filename) -> dict:
    return import_locations_areas_file(name, filename)


@job('default', timeout=15*60)
def import_reconciled_task(name, filename) -> dict:
    return import_reconciled_file(name, filename)


@job('default', timeout=15*60)
def import_synced_devices_task() -> list:
    return import_synced_devices()


################################################################################
# cases
################################################################################

@job('default', timeout=15*60)
def duplicates_task():
    with connection.cursor() as cursor:
        cursor.execute(duplicates_queries.makepairs())


################################################################################
# events
################################################################################

@job('default', timeout=30*60)
def dump_events_task():
    from hat.import_export.dump import dump_events
    return dump_events()


@job('default', timeout=30*60)
def load_events_dump_task(filename):
    from hat.import_export.dump import load_events_dump
    return load_events_dump(filename)
