from typing import Callable
from urllib.parse import urlparse
from requests import Request
from django.conf import settings
from hat.common.utils import run_cmd
from . import api


def walk_changes(db: str, f: Callable[[dict], None], *args, **kwargs) -> None:
    supplied_params = kwargs.get('params', {})
    # set some defaults
    params = {'since': 0, 'limit': 100, **supplied_params}
    # loop and fetch changes until the end of the changes has been reached
    while True:
        ks = {**kwargs, 'params': params}
        r = api.get(db + '/_changes', *args, **ks)
        r.raise_for_status()
        j = r.json()
        cs = j['results']
        done = len(cs) == 0 or len(cs) < params['limit']
        for c in cs:
            f(c)
        if done:
            break
        params = {**params, 'since': j['last_seq']}


def force_put_doc(path: str, document: dict) -> Request:
    doc = document.copy()
    r = api.get(path)
    if r.status_code == 404:
        # the doc does not exist
        pass
    else:
        r.raise_for_status()
        j = r.json()
        if '_rev' in j:
            doc['_rev'] = j['_rev']
    r = api.put(path, json=doc)
    r.raise_for_status()
    return r


def bootstrap_couchdb():
    o = urlparse(settings.COUCHDB_URL)
    couchdb_url = '{}://{}:{}@{}'.format(
        o.scheme,
        settings.COUCHDB_USER, settings.COUCHDB_PASSWORD,
        o.netloc
    )
    cmd = ['couchdb-bootstrap', couchdb_url, settings.COUCHDB_DIR]
    # When testing, the db name will be '*_test' and if it already
    # exists, it will be dropped to start with an empty db.
    if settings.TESTING:
        test_db = settings.COUCHDB_DB
        cmd.append('--mapDbName={"hat":"' + test_db + '"}')
        r = api.get(test_db)
        if r.status_code < 400:
            # couchdb already exists we'll delete it before recreating
            api.delete(test_db)

    r = run_cmd(cmd)
    return r
