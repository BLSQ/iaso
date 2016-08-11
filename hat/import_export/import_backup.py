import logging
import json
import pandas
from pandas import DataFrame
from pandas.io.json import json_normalize
from django.conf import settings
from hat.common.utils import run_cmd
from .load import load_into_db, store_file
from .utils import hash_df_row
from hat.import_export import errors

logger = logging.getLogger(__name__)


def extract(filename: str):
    r = run_cmd(['./scripts/decrypt_mobilebackup.js', settings.MOBILE_KEY, filename])
    data = json.loads(r)
    return json_normalize(data)


def transform_tests(df: DataFrame):
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


def transform_participants(df: DataFrame):
    df2 = DataFrame()

    df2['document_id'] = df.apply(hash_df_row, axis=1)
    df2['hat_id'] = df['participant.hatId']

    df2['document_date'] = df['dateModified']
    df2['entry_date'] = df['dateCreated']

    # middlename changed to postname with v3
    if 'person.middlename' in df:
        df2['name'] = df['person.middlename']
    if 'person.postname' in df:
        df2['name'] = df['person.postname']

    df2['lastname'] = df['person.surname']
    df2['prename'] = df['person.forename']

    # mothersForename changed to mothersSurname with v4
    if 'person.mothersSurname' in df:
        df2['mothers_surname'] = df['person.mothersSurname']
    if 'person.mothersForename' in df:
        df2['mothers_surname'] = df['person.mothersForename']

    df2['sex'] = df['person.gender'].str.lower()

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

    df2['source'] = 'mobile_backup'
    return df2


def transform(df: DataFrame):
    ps = transform_participants(df)
    ts = transform_tests(df)
    return pandas.concat([ps, ts], axis=1)


def import_backup(orgname: str, filename: str, store=False):
    logger.info('Importing backup: ' + orgname + ' from: ' + filename)
    stats = {
        'type': 'backup_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'stored': store,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    try:
        # set error origin for reporting
        origin = errors.READFILE
        # import the data
        e = extract(filename)
        # set error origin for reporting
        origin = errors.INSERT
        t = transform(e)
        l = load_into_db(t)
        stats['num_total'] = len(e)
        stats['num_imported'] = len(l)
    except Exception as exc:
        stats['errors'].append({'origin': origin, 'message': str(exc)})
        logger.exception(exc)

    if store:
        # Store the files in couch to reparse them on demand
        try:
            doc = stats.copy()
            id = store_file(doc, filename, 'application/x-hatbackup')
            stats['store_id'] = id
        except Exception as exc:
            stats['errors'].append({'origin': errors.COUCHDB, 'message': str(exc)})
            logger.exception(exc)
    return stats
