from typing import List, Tuple
from django_rq import job

from .export_csv import export_csv
from .import_cases import import_cases_file
from .import_locations import import_locations_file, import_locations_areas_file
from .import_reconciled import import_reconciled_file
from .reimport import reimport


@job('default', timeout=15*60)
def import_task(fileinfos: List[Tuple[str, str]]) -> dict:
    results = []
    for (name, filename) in fileinfos:
        results.append(import_cases_file(name, filename, store=True))
    return results


@job('default', timeout=15*60, result_ttl=60*60)
def export_task(**kwargs) -> str:
    return export_csv(**kwargs)


@job('default', timeout=15*60)
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
