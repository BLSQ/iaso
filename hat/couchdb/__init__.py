from typing import Callable
import requests
from requests import Request
from django.conf import settings

'''
thin wrapper on top of requests for convenient requests to couchdb
'''

url = settings.COUCHDB_URL
defaults = {'auth': (settings.COUCHDB_USER, settings.COUCHDB_PASSWORD)}


def get(path: str, *args, **kwargs) -> Request:
    ks = {**defaults, **kwargs}
    return requests.get(url + '/' + path, *args, **ks)


def head(path: str, *args, **kwargs) -> Request:
    ks = {**defaults, **kwargs}
    return requests.get(url + '/' + path, *args, **ks)


def post(path: str, *args, **kwargs) -> Request:
    ks = {**defaults, **kwargs}
    return requests.post(url + '/' + path, *args, **ks)


def put(path: str, *args, **kwargs) -> Request:
    ks = {**defaults, **kwargs}
    return requests.put(url + '/' + path, *args, **ks)


def delete(path: str, *args, **kwargs) -> Request:
    ks = {**defaults, **kwargs}
    return requests.delete(url + '/' + path, *args, **ks)


def walk_changes(db: str, f: Callable[[dict], None], *args, **kwargs) -> None:
    supplied_params = kwargs.get('params', {})
    params = {'since': 0, 'limit': 100, **supplied_params}
    while True:
        ks = {**defaults, **kwargs, 'params': params}
        r = get(db + '/_changes', *args, **ks)
        r.raise_for_status()
        j = r.json()
        cs = j['results']
        done = len(cs) == 0 or len(cs) < params['limit']
        for c in cs:
            f(c)
        if done:
            break
        params = {**params, 'since': j['last_seq']}
