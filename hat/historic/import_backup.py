import logging
from base64 import b64encode
import json
import pandas
from pandas import DataFrame
from pandas.io.json import json_normalize
from django.conf import settings
from hat import couchdb
from hat.common.utils import run_cmd
from .load import load
from .utils import hash_df_row, tz_localize_cd


logger = logging.getLogger(__name__)


def extract(filename):
    r = run_cmd(['./scripts/decrypt_mobilebackup.js', './privatekey.json', filename])
    data = json.loads(r)
    return json_normalize(data)


def transform_tests(df):
    def get_result(x):
        if pandas.isnull(x):
            return None
        return x == 'positive'

    df2 = DataFrame()
    tests = [
        ('rdt', get_result),
        ('catt', get_result),
        ('pg', get_result),
        ('maect', get_result),
        ('ctcwoo', get_result),
        ('ge', get_result),
        ('pl', get_result)
    ]
    for (test, f) in tests:
        src = 'participant.screenings.{}.result'.format(test)
        dst = 'test_{}'.format(test)
        if src in df:
            df2[dst] = df[src].apply(f)
    return df2


def transform_participants(df):
    df2 = DataFrame()

    df2['source'] = 'mobile_backup'
    df2['document_id'] = df.apply(hash_df_row, axis=1)
    df2['document_date'] = tz_localize_cd(df['dateModified'])
    df2['entry_date'] = tz_localize_cd(df['dateCreated'])
    df2['hat_id'] = df['participant.hatId']

    df2['name'] = df['person.postname']
    df2['lastname'] = df['person.surname']
    df2['prename'] = df['person.forename']
    df2['mothers_surname'] = df['person.mothersSurname']

    df2['sex'] = df['person.gender']

    age_years = 0
    age_months = 0
    if 'person.age.years' in df:
        age_years = df['person.age.years'].fillna(0).astype(float)
    if 'person.age.months' in df:
        age_months = df['person.age.months'].fillna(0).astype(float) / 12
    df2['age'] = age_years + age_months
    df2['year_of_birth'] = df['person.birthYear']

    if 'person.location.province' in df:
        df2['province'] = df['person.location.province']
    df2['ZS'] = df['person.location.zone']
    df2['AZ'] = df['person.location.area']
    df2['village'] = df['person.location.village']

    return df2


def transform(df):
    ps = transform_participants(df)
    ts = transform_tests(df)
    return pandas.concat([ps, ts], axis=1)


def import_backup(orgname, filename):
    logger.info('Importing encrypted backup: ' + orgname)
    stats = {
        'type': 'backup_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    try:
        # import the data
        e = extract(filename)
        t = transform(e)
        l = load(t)
        stats['num_total'] = len(e)
        stats['num_imported'] = len(l)
    except Exception as exc:
        stats['errors'].append(str(exc))
        logger.exception(exc)
    try:
        # Store the files in couch to reparse them on demand
        doc = stats.copy()
        with open(filename, 'rb') as file:
            doc['_attachments'] = {
                'file': {
                    'content_type': 'application/x-hatbackup',
                    'data': b64encode(file.read()).decode('ascii')
                }
            }
        couchdb.post(settings.COUCHDB_DB, json=doc)
    except Exception as exc:
        stats['errors'].append(str(exc))
        logger.exception(exc)
    return stats
