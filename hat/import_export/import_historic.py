from typing import Tuple, Dict
import logging
import pandas
from functools import reduce
from pandas import DataFrame
from hat.common.mdb import extract_mdbtable_via_db
from .load import load_into_db, store_file
from .utils import hash_df_row
from hat.import_export import errors

logger = logging.getLogger(__name__)


def extract(mdb_file: str) -> Dict[str, DataFrame]:
    return {
        'cards': extract_mdbtable_via_db(mdb_file, 'T_CARDS'),
        'followups': extract_mdbtable_via_db(mdb_file, 'T_FOLLOWUPS')
    }

def transform_tests(cards: DataFrame, followups: DataFrame) -> DataFrame:
    # Reduce multiple followups for one card into a single followup.
    # In case there is more than one followup for one card, all followups
    # for that card will be merged into a single followup where the most
    # recent value wins, that is not None.
    reduced_followups = followups.sort_values(by='S_DATE_RV') \
                                 .groupby('F_ID') \
                                 .agg(lambda s: reduce(lambda r, x: x or r, s))

    # The reduced followups can now be merged into the cards
    source = pandas.merge(cards, reduced_followups, how='left', left_on='F_ID', right_index=True)

    result = DataFrame()

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

    fields = [
        # card test fields
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
        ("DS_PL_COMMENTS", str, 'pl_comments', identity),

        # followup test fields
 	("S_PG", str, 'followup_pg', identity),
	("S_SF", str, 'followup_sf', identity),
	("S_GE", str, 'followup_ge', identity),
	("S_WOO", str, 'followup_woo', identity),
	("S_MAECT", str, 'followup_maect', identity),
	("S_WOO_MAECT", str, 'followup_woo_maect', identity),
	("S_PL", str, 'followup_pl', identity),
	("S_PL_TRYP", str, 'followup_pl_trypanosome', identity),
	("S_PL_GB", str, 'followup_pl_gb', identity),
	("S_DECISION", str, 'followup_decision', identity),
    ]
    for (src_col, _, dest_col, f) in fields:
        if src_col in source:
            result['test_' + dest_col] = source[src_col].apply(f)
    return result


def transform_participants(cards: DataFrame, followups: DataFrame) -> DataFrame:
    result = DataFrame()

    result['document_id'] = cards.apply(hash_df_row, axis=1)

    result['document_date'] = cards['D_DATE']
    result['entry_date'] = cards['F_TIMESTAMP']

    result['mobile_unit'] = cards['IF_UM']
    result['treatment_center'] = cards['IM_UM_CT']

    result['name'] = cards['IM_NAME']
    result['lastname'] = cards['IM_LASTNAME']
    result['prename'] = cards['IM_PRENAME']

    def parse_sex(x):
        return {'Féminin': 'female', 'Masculin': 'male'}.get(x, 'unknown')
    result['sex'] = cards['IM_SEX'].apply(parse_sex)

    result['age'] = cards['IM_AGE']
    result['year_of_birth'] = cards['IM_BIRTHYEAR']
    result['mothers_surname'] = cards['IM_MERE']

    result['hat_id'] = (
        result['lastname'].fillna('XX').str[0:2] +
        result['name'].fillna('XX').str[0:2] +
        result['prename'].fillna('XX').str[0:2] +
        result['year_of_birth'].fillna(1900).astype('str') +
        result['mothers_surname'].fillna('XX').str[0:1]
    ).str.upper()

    result['village'] = cards['IM_AD_VILLAGE']
    result['province'] = cards['IM_AD_PROVINCE']
    result['ZS'] = cards['IM_AD_HEALTH_ZONE']
    result['AZ'] = cards['IM_AD_HEALTH_AREA']

    result['source'] = 'historic'
    result['followup_done'] = cards['F_ID'].isin(list(followups['F_ID']))

    return result


def transform(tables: Dict[str, DataFrame]):
    cs = transform_participants(tables['cards'], tables['followups'])
    ts = transform_tests(tables['cards'], tables['followups'])
    return pandas.concat([cs, ts], axis=1)


def read_entry_name(orgname: str) -> str:
    """
    removes last section of filename, assuming the beginning is name of the entry clerk
    """
    parts = orgname.split('-')
    parts.pop()
    return ' '.join(parts)


def import_historic(orgname: str, filename: str, store=False):
    logger.info('Importing historic file: ' + orgname)
    stats = {
        'type': 'historic_import',
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
        # get entry name
        entry_name = read_entry_name(orgname)
        # import the data
        e = extract(filename)
        # set error origin for reporting
        origin = errors.INSERT
        t = transform(e)
        t['entry_name'] = entry_name
        l = load_into_db(t)
        stats['num_total'] = len(es['cards'])
        stats['num_imported'] = len(l)
    except Exception as exc:
        stats['errors'].append({'origin': origin, 'message': str(exc)})
        logger.exception(exc)

    if store:
        # Store the files in couch to reparse them on demand
        try:
            doc = stats.copy()
            id = store_file(doc, filename, 'application/x-msaccess')
            stats['store_id'] = id
        except Exception as exc:
            stats['errors'].append({'origin': errors.COUCHDB, 'message': str(exc)})
            logger.exception(exc)
    return stats
