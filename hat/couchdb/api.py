import requests
from requests import Request
from django.conf import settings

'''
thin wrapper on top of requests for convenient calls to couchdb
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
