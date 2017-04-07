'''
Extract data
------------

This module extracts the data from all the available sources.

Current supported sources are:

- MS Access historic cases MDB files
- Pharmacovigilance cases MDB files
- Sense HAT Mobile App encrypted backup files
- Sense HAT Mobile App data that were synced to couchdb
- Reconciled cases CSV/XLSX files

'''

from typing import Dict, List, Union, Tuple
from hat.common.typing import JsonType
from pandas import DataFrame
import json
import pandas
from io import StringIO
from pathlib import PurePath
from pandas.io.json import json_normalize
import hat.common.mdb as mdb
from .errors import ImportStage, ImportStageException
from django.utils.translation import ugettext as _
from .mapping import IMPORT_CONFIG


def extract_mdb_data(filename: str) -> Dict[str, str]:
    '''
    Receives the MDB file address, opens it and extracts the raw data.

    The returned dict contains the raw data extracted from the MDB file.
    '''

    return mdb.get_all_tables(filename)


def extract_backup_data(filename: str) -> JsonType:
    '''
    Receives the backup file address, decrypts it and extracts the raw data.

    The returned Json contains the raw data extracted from the backup file.
    '''

    from django.conf import settings
    from hat.common.utils import run_cmd
    data = run_cmd(['./scripts/decrypt_mobilebackup.js', settings.MOBILE_KEY, filename])
    return json.loads(data)


def extract_file_data(filename: str) -> Tuple[str, Union[Dict[str, str], JsonType]]:
    '''
    Receives the file address, reads it and extracts the raw data.

    The returned tuple contains the raw data extracted from the file.
    '''

    suffix = PurePath(filename).suffix.lower()
    if suffix in ['.mdb', '.accdb']:
        tables = extract_mdb_data(filename)
        if IMPORT_CONFIG['historic']['main_table'] in tables:
            return ('historic', tables)
        elif IMPORT_CONFIG['pv']['main_table'] in tables:
            return ('pv', tables)
        else:
            err_msg = _('Cannot import unkown mdb schema')
            raise ImportStageException(err_msg, ImportStage.filetype)

    elif suffix == '.enc':
        return ('backup', extract_backup_data(filename))

    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        raise ImportStageException(err_msg, ImportStage.filetype)


def extract_reconciliation_file(filename: str) -> DataFrame:
    '''
    Receives the CSV/XLSX file address, reads it and extracts the raw data.

    The returned DataFrame contains the raw data extracted from the backup file.
    '''

    suffix = PurePath(filename).suffix.lower()
    if suffix == '.csv':
        return pandas.read_csv(filename)
    elif suffix == '.xlsx':
        return pandas.read_excel(filename)
    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        raise ImportStageException(err_msg, ImportStage.filetype)


def prepare_mdb_data(source_type: str, tables: Dict[str, str]) -> Dict[str, DataFrame]:
    import_config = IMPORT_CONFIG[source_type]
    result = {}
    for table_name, options in import_config['import_options'].items():
        csv = tables[table_name]
        df = pandas.read_csv(
            StringIO(csv),
            delimiter=';',
            **options
        )
        if "parse_dates" in options:
            # Add utc timezone to dates. The dates in the data are naive and have no timezone.
            # The datebases requires timezones to be set on dates.
            for date_field in options["parse_dates"]:
                if date_field in df.columns.values:
                    df[date_field] = df[date_field].dt.tz_localize('UTC')
        result[table_name] = df
    return result


def prepare_mobile_data(docs: List[JsonType]) -> Dict[str, DataFrame]:
    # keep cases only for this import,
    # (might be locations in the data as well)
    docs = [doc for doc in docs if 'type' in doc and doc['type'] == 'participant']

    if len(docs) > 0:
        df = json_normalize(docs)
    else:
        return {'main': pandas.DataFrame()}

    # TODO: We upgrade some fields manually here until we have the versioning module
    #       ready that is supposed to provide upgrade functions for mobile data.
    if 'person.mothersForename' in df:
        if 'person.mothersSurname' not in df:
            df['person.mothersSurname'] = df['person.mothersForename']
        else:
            df['person.mothersSurname'].fillna(df['person.mothersForename'], inplace=True)
    if 'person.middlename' in df:
        if 'person.postname' not in df:
            df['person.postname'] = df['person.middlename']
        else:
            df['person.postname'].fillna(df['person.middlename'], inplace=True)
    if 'person.postname' not in df:
        df['person.postname'] = ''

    # the transformation supports multiple tables -- here we only have one that we call 'main'
    return {"main": df}
