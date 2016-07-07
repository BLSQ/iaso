import requests
import json


def importdocs(dburl, docs):
    payload = json.dumps({'docs': docs})
    headers = {'content-type': 'application/json'}
    r = requests.post(dburl + '/_bulk_docs', data=payload, headers=headers)
    if r.status_code >= 400:
        raise Exception('Couchdb bulk import failed: ' + r.text)
