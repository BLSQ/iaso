from django.conf import settings
import requests

'''
thin wrapper on top of requests for convenient requests to couchdb
'''

url = settings.COUCHDB_URL
defaults = {'auth': (settings.COUCHDB_USER, settings.COUCHDB_PASSWORD)}


def get(path, *args, **kwargs):
    ks = {**defaults, **kwargs}
    r = requests.get(url + '/' + path, *args, **ks)
    return r.json(), r


def post(path, *args, **kwargs):
    ks = {**defaults, **kwargs}
    r = requests.post(url + '/' + path, *args, **ks)
    return r.json(), r


def put(path, *args, **kwargs):
    ks = {**defaults, **kwargs}
    r = requests.put(url + '/' + path, *args, **ks)
    return r.json(), r


def delete(path, *args, **kwargs):
    ks = {**defaults, **kwargs}
    r = requests.delete(url + '/' + path, *args, **ks)
    return r.json(), r
