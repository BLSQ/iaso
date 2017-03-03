import json
from io import StringIO
from pathlib import PurePath
from pandas.io.json import json_normalize
from pandas import DataFrame, read_csv
import hat.common.mdb as mdb
from .errors import ImportStage, ImportStageException
from django.utils.translation import ugettext as _

################################################################################
# Configuration for the extraction of data from different sources
#
# `type` - The value that will be set as `source` on the model
# `mapping_field` - the field in the mapping in `transform.py`
# `main_table` - name of the table with the cases/persons
# `import_options` - Dict of tables to extract from the files.
#                    In the case of mdb files, those are the options passed to pandas.
#
IMPORT_CONFIG = {
    "historic": {
        "type": "historic",
        "mapping_field": "historic",
        "main_table": "T_CARDS",
        "import_options": {
            "T_CARDS": {
                "index_col": 0,
                "parse_dates": ['D_DATE', 'F_TIMESTAMP', "TP_DATE", "TP_DATE_END"],
                "infer_datetime_format": True,
            },
            "T_FOLLOWUPS": {
                "index_col": 1,
                "infer_datetime_format": True,
            }
        }
    },
    "pv": {
        "type": "pv",
        "mapping_field": "pv",
        "main_table": "tblFishedeDeclaration",
        "import_options": {
            "tblFishedeDeclaration": {
                "index_col": 0,
                "parse_dates": ['Date de diagnostique'],
                "dtype": {
                    'Années': 'str',           # nan, year(2006) or year range(2006-2007)
                    'Latex LCR': 'str',        # nan, string('1/16')
                    'Qualification de la personne2': 'str',  # can be nan or string
                    'UM/CT_FchDecede': 'str',  # nan or string
                    'Date du décès': 'str',    # nan or '02/01/09 00:00:00' datetime
                    'Autre cause:': 'str',     # nan or string
                    'Autres signes': 'str',    # nan or string
                    'Autres signes1': 'str',   # nan or string
                    'Autres signes2': 'str',   # nan or string
                    'Autres signes3': 'str',   # nan or string
                    "Infection du site d'injection": 'str',   # nan or string
                },
                "infer_datetime_format": True,
            },
            "tblTraitementPrescrit": {
                "index_col": 1,
                "parse_dates": ["Date début réel", "Date fin"],
                "dtype": {
                    "DDR": 'str',                   # nan and datetime
                    "Fréq pouls": 'str',            # numbers and dates
                    "Température": 'str',           # numbers, strings like "normal", nan
                    "Tension artériel": "str",      # fractions(9/8) and nan
                    "Fréq respiratoire": 'str',     # numbers, dates, strings, "NF"
                    "Traitement Prescrit": "str",   # strings and nan
                    "Traitement Prescrit specifique": 'str',  # strings and nan
                    "Date de prescription": 'str',  # datetimes and nan
                    "Centre recommandé": 'str',     # nan and strings
                },
                "infer_datetime_format": True,
            },
            "tblSuivi": {
                "index_col": 1
            }
        }
    },
    "backup": {
        "type": "mobile_backup",
        "mapping_field": "mobile",
        "main_table": "main",
    },
    "sync": {
        "type": "mobile_sync",
        "mapping_field": "mobile",
        "main_table": "main",
    },
}


def extract_mdb_data(filename):
    return mdb.get_all_tables(filename)


def extract_backup_data(filename):
    from django.conf import settings
    from hat.common.utils import run_cmd
    data = run_cmd(['./scripts/decrypt_mobilebackup.js', settings.MOBILE_KEY, filename])
    return json.loads(data)


def extract_file_data(filename):
    suffix = PurePath(filename).suffix.lower()
    if suffix in ['.mdb', '.accdb']:
        tables = extract_mdb_data(filename)
        if IMPORT_CONFIG['historic']['main_table'] in tables:
            return ('historic', tables)
        elif IMPORT_CONFIG['pv']['main_table'] in tables:
            return ('pv', tables)

    elif suffix == '.enc':
        return ('backup', extract_backup_data(filename))

    else:
        err_msg = _('Cannot import unkown filetype: {}').format(suffix)
        raise ImportStageException(err_msg, ImportStage.filetype)


def prepare_mdb_data(tables, import_options):
    result = {}
    for table_name, options in import_options.items():
        csv = tables[table_name]
        kwargs = {'sep': ';', **options}
        df = read_csv(StringIO(csv), **kwargs)
        if "parse_dates" in options:
            # Add utc timezone to dates. The dates in the data are naive and have no timezone.
            # The datebases requires timezones to be set on dates.
            for date_field in options["parse_dates"]:
                df[date_field] = df[date_field].dt.tz_localize('UTC')
        result[table_name] = df
    return result


def prepare_mobile_data(docs):
    # keep cases only for this import,
    # (might be locations in the data as well)
    docs = [doc for doc in docs if 'type' in doc and doc['type'] == 'participant']

    if len(docs) > 0:
        df = json_normalize(docs)
    else:
        return {'main': DataFrame()}

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
