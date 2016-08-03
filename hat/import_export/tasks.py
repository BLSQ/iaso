from typing import List, Tuple
from rq.decorators import job
from hat.rq import redis_conn
from .export_csv import export_csv
from .import_data import import_file, reimport


@job('default', connection=redis_conn)
def import_files_task(fileinfos: List[Tuple[str, str]], *args, **kwargs):
    results = []
    for (name, filename) in fileinfos:
        results.append(import_file(name, filename, store=True))
    return results


@job('default', connection=redis_conn)
def export_task():
    return export_csv()


@job('default', connection=redis_conn)
def reimport_task():
    return reimport()
