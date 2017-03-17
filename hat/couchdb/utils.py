from typing import Callable, List, Dict
from hat.common.typing import JsonType
from urllib.parse import urlparse
from requests import Response
from django.conf import settings
from hat.common.utils import run_cmd
from . import api


def walk_changes(db: str,
                 f: Callable[[Dict], None],
                 *args: List,
                 **kwargs: Dict) -> None:
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


def force_put_doc(path: str, document: JsonType) -> Response:
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


def bootstrap_couchdb(cleanup: bool=True) -> str:
    o = urlparse(settings.COUCHDB_URL)
    couchdb_url = '{}://{}:{}@{}'.format(
        o.scheme,
        settings.COUCHDB_USER, settings.COUCHDB_PASSWORD,
        o.netloc
    )
    cmd = ['couchdb-bootstrap', couchdb_url, settings.COUCHDB_DIR]
    # When testing, the db name will be '*_test' and if it already
    # exists, it will be dropped to start with an empty db.
    if cleanup:
        test_db = settings.COUCHDB_DB
        cmd.append('--mapDbName={"hat":"' + test_db + '"}')
        r = api.get(test_db)
        if r.status_code < 400:
            # couchdb already exists we'll delete it before recreating
            api.delete(test_db)

    return run_cmd(cmd)


def fetch_dbs_info() -> JsonType:
    r = api.get('_all_dbs')

    # get the list of non-private databases
    dbs = [db for db in r.json() if not db.startswith('_')]

    # create the dict of existing and valid databases with info
    results = {}
    for dbname in dbs:
        db = api.get(dbname)
        db.raise_for_status()
        results[dbname] = db.json()
    return results


def fetch_db_docs(dbname: str, last_seq: str) -> JsonType:
    '''
    get all changed documents in the database since last sequence
    '''
    changes_url = '{}/_changes?style=all_docs&include_docs=true&since={}'.format(dbname, last_seq)

    r = api.get(changes_url)
    r.raise_for_status()
    result = r.json()
    return {
        'last_seq': result['last_seq'],
        'docs': [doc['doc'] for doc in result['results']],
    }
