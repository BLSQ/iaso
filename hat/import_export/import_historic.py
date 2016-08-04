import logging
from base64 import b64encode
import pandas
from pandas import DataFrame
from django.conf import settings
from hat import couchdb
from hat.common.mdb import extract_mdbtable_via_db
from .load import load
from .utils import hash_df_row, tz_localize_cd


logger = logging.getLogger(__name__)


def extract(mdb_file: str):
    return extract_mdbtable_via_db(mdb_file, 'T_CARDS')


def transform_tests(df):
    df2 = DataFrame()

    def identity(x):
        return x

    def get_result(x):
        if pandas.isnull(x) or x == 99:
            return None
        return x == -1

    def get_catt_blood_result(x):
        if pandas.isnull(x) or x == 99:
            return None
        return x < 0

    def get_catt_dil_result(x):
        if pandas.isnull(x) or x == 99:
            return None
        return 1 <= x <= 5

    def get_pl_result(x):
        return {1: 'stage1', 2: 'stage2', 3: 'unknown'}.get(x, None)

    tests = [
        ("D_CATT_TOTAL_BLOOD", int, 'catt_total_blood', get_catt_blood_result),
        ("D_TDR", int, 'rdt', get_result),
        ("D_CATT_DILUTION", int, 'catt_dilution', get_catt_dil_result),
        ("MD_LYMPH_NODE_PUNCTURE", int, 'lymph_node_puncture', get_result),
        ("MD_SF", int, 'sf', get_result),
        ("MD_GE", int, 'ge', get_result),
        ("MD_WOO", int, 'woo', get_result),
        ("MD_MAEC", int, 'maec', get_result),
        ("MD_MAECT", int, 'maect', get_result),
        ("MD_MAECT_BC", int, 'maect_bc', get_result),
        ("MD_LCR", int, 'lcr', get_result),
        ("MD_LCR_FR", int, 'lcr_fr', get_result),
        ("MD_LCR_SCM", int, 'lcr_scm', get_result),
        ("MD_DIL", int, 'dil', get_result),
        ("MD_PARASIT", int, 'parasit', get_result),
        ("MD_STERNAL_PUNCTURE", int, 'sternal_puncture', get_result),
        ("MD_IFAT", int, 'ifat', get_result),
        ("MD_CATT", int, 'catt', get_result),
        ("MD_CLINICAL_SICKNESS", int, 'clinical_sickness', get_result),
        ("MD_OTHER", int, 'other', get_result),
        ("DS_PL_LIQUID", int, 'pl_liquid', get_result),
        ("DS_PL_TRYPANOSOME", str, 'pl_trypanosome', identity),
        ("DS_PL_GB_MM3", str, 'pl_gb_mm3', identity),
        ("DS_PL_ALBUMINE", str, 'pl_albumine', identity),
        ("DS_PL_LCR", int, 'pl_lcr', get_result),
        ("DS_PL_RESULT", int, 'pl_result', get_pl_result),
        ("DS_PL_COMMENTS", str, 'pl_comments', identity)
    ]
    for (src, _, dest, f) in tests:
        if src in df:
            df2['test_' + dest] = df[src].apply(f)
    return df2


def transform_participants(df):
    df2 = DataFrame()

    df2['source'] = 'historic'
    df2['document_id'] = df.apply(hash_df_row, axis=1)
    df2['document_date'] = tz_localize_cd(df['D_DATE'])
    df2['entry_date'] = tz_localize_cd(df['F_TIMESTAMP'])

    df2['mobile_unit'] = df['IF_UM']
    df2['treatment_center'] = df['IM_UM_CT']

    df2['name'] = df['IM_NAME']
    df2['lastname'] = df['IM_LASTNAME']
    df2['prename'] = df['IM_PRENAME']

    def parse_sex(x):
        return {'Féminin': 'female', 'Masculin': 'male'}.get(x, None)
    df2['sex'] = df['IM_SEX'].apply(parse_sex)

    df2['age'] = df['IM_AGE']
    df2['year_of_birth'] = df['IM_BIRTHYEAR']
    df2['mothers_surname'] = df['IM_MERE']

    df2['hat_id'] = (
        df2['lastname'].fillna('').str[0:2] +
        df2['name'].fillna('').str[0:2] +
        df2['prename'].fillna('').str[0:2] +
        df2['year_of_birth'].fillna(1900).astype('str') +
        df2['mothers_surname'].fillna('').str[0:1]
    )

    df2['village'] = df['IM_AD_VILLAGE']
    df2['province'] = df['IM_AD_PROVINCE']
    df2['ZS'] = df['IM_AD_HEALTH_ZONE']
    df2['AZ'] = df['IM_AD_HEALTH_AREA']

    return df2


def transform(df):
    cs = transform_participants(df)
    ts = transform_tests(df)
    return pandas.concat([cs, ts], axis=1)

def read_entry_name(orgname):
    # removes last section of filename,
    # assuming the beginning is name of the entry clerk
    parts = orgname.split('-')
    parts.pop()
    return ' '.join(parts)

def import_historic(orgname, filename):
    logger.info('Importing historic mdb-file: ' + orgname)
    stats = {
        'type': 'historic_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    try:
        # get entry name
        entry_name = read_entry_name(orgname)
        # import the data
        e = extract(filename)
        t = transform(e)
        t['entry_name'] = entry_name
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
                    'content_type': 'application/x-msaccess',
                    'data': b64encode(file.read()).decode('ascii')
                }
            }
        couchdb.post(settings.COUCHDB_DB, json=doc)
    except Exception as exc:
        stats['errors'].append(str(exc))
        logger.exception(exc)
    return stats
