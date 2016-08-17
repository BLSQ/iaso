from typing import List, Tuple
from rq.decorators import job
from hat.rq import redis_conn
from .export_csv import export_csv
from .import_data import import_file, reimport


@job('default', connection=redis_conn)
def import_task(fileinfos: List[Tuple[str, str]]) -> dict:
    results = []
    for (name, filename) in fileinfos:
        results.append(import_file(name, filename, store=True))
    return results


@job('default', connection=redis_conn)
def export_task(**kwargs) -> str:
    return export_csv(**kwargs)


@job('default', connection=redis_conn)
def reimport_task() -> dict:
    return reimport()
