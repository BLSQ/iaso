from hashlib import md5
from base64 import b64encode
from string import capwords
import re
import pandas
from pandas import Series
from django.conf import settings
import hat.couchdb.api as couchdb


def capitalize(x: str) -> str:
    if pandas.isnull(x):
        return None
    return capwords(x)


def create_documentid(row: Series) -> str:
    '''
    Hash some columns to create the document id
    IMPORTANT: We use the `document_id` to identify cases. If something in
               the import code changes, this function should still produce
               the same id for a case as it did before the change. So that
               cases that are reimported will get the same id as when they
               were exported in the past.
    '''
    COLUMNS = [
        # 'document_date',
        'name',
        'lastname',
        'prename',
        'sex',
        'year_of_birth',
        'mothers_surname',
        'village',
        'province',
        'ZS',
        'AZ'
    ]
    t = tuple(row[COLUMNS])
    h = md5()
    for x in t:
        h.update(str(x).encode())
    return h.hexdigest()


def strip_accents(s: str) -> str:
    s = re.sub(r'[ÀÁÂ]', 'A', s, flags=re.I)
    s = re.sub(r'[ÈÉÊ]', 'E', s, flags=re.I)
    s = re.sub(r'Û', 'U', s, flags=re.I)
    s = re.sub(r'[^A-Z0-9]', '', s, flags=re.I)
    if len(s) == 0:
        return 'XX'
    if len(s) == 1:
        return s + 'X'
    return s


def hat_id(row: Series) -> str:
    '''
    This generates a HAT-Id from a couple of values.
    It's important that it works the same as the function in sense-hat-mobile:
    https://github.com/eHealthAfrica/sense-hat-mobile/blob/develop/src/data/mapping.js#L110-L117
    '''
    empty = 'XX'
    r2 = row.dropna()

    if 'lastname' in r2:
        lastname = strip_accents(r2['lastname'])
    else:
        lastname = empty

    if 'name' in r2:
        name = strip_accents(r2['name'])
    else:
        name = empty

    if 'prename' in r2:
        prename = strip_accents(r2['prename'])
    else:
        prename = empty

    if 'sex' in r2:
        sex = r2['sex']
    else:
        sex = empty

    if 'year_of_birth' in r2:
        yob = str(r2['year_of_birth'])
    else:
        yob = 'XXXX'

    if 'mothers_surname' in r2:
        mothers = strip_accents(r2['mothers_surname'])
    else:
        mothers = empty

    return (
        lastname[0:2] +
        name[0:2] +
        prename[0:2] +
        sex[0:1] +
        yob[0:4] +
        mothers[0:1]
    ).upper()


def hash_file(filename: str) -> str:
    hasher = md5()
    with open(filename, 'rb') as file:
        hasher.update(file.read())
    return hasher.hexdigest()


def store_raw_file(doc: dict, filename: str, mimetype: str) -> str:
    with open(filename, 'rb') as file:
        doc['_attachments'] = {
            'file': {
                'content_type': mimetype,
                'data': b64encode(file.read()).decode('ascii')
            }
        }
    r = couchdb.post(settings.COUCHDB_DB, json=doc)
    r.raise_for_status()
    return r.json()['id']


def location_classification(s: str) -> str:
    switcher = {
        'YES': 'official',
        'NO': 'non official',
        'OTHER': 'other',
        'NA': 'unknown'
    }
    return switcher.get(s, '---')
