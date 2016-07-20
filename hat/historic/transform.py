from functools import partial
from hashlib import md5
from pandas import DataFrame


def getTestResult(tests, row):
    results = [f(row[col]) for (col, f) in tests if col in row]
    return 'positive' if any(results) else 'negative'


screening_tests = [
    ('D_CATT_TOTAL_BLOOD', lambda x: x != 0),
    ('D_TDR', lambda x: x == -1)
]


def isCattDilutionPositive(value):
    # TODO implement
    return False


def isMdPositive(value):
    return value == -1


confirmation_tests = [
    ('D_CATT_DILUTION', isCattDilutionPositive),
    ('MD_LYMPH_NODE_PUNCTURE', isMdPositive),
    ('MD_SF', isMdPositive),
    ('MD_GE', isMdPositive),
    ('MD_WOO', isMdPositive),
    ('MD_MAEC', isMdPositive),
    ('MD_MAECT', isMdPositive),
    ('MD_MAECT_BC', isMdPositive),
    ('MD_LCR', isMdPositive),
    ('MD_LCR_FR', isMdPositive),
    ('MD_LCR_SCM', isMdPositive),
    ('MD_DIL', isMdPositive),
    ('MD_PARASIT', isMdPositive),
    ('MD_STERNAL_PUNCTURE13', isMdPositive),
    ('MD_IFAT', isMdPositive),
    ('MD_CATT', isMdPositive),
    ('MD_CLINICAL_SICKNESS', isMdPositive),
    ('MD_OTHER', isMdPositive)
]


# pl tests

def parse_pl_result(val):
    enum = {1: 'stage1', 2: 'stage2', 3: 'unknown'}
    return enum.get(val, 'none')


def parse_sex(val):
    enum = {'Féminin': 'female', 'Masculin': 'male'}
    return enum.get(val, 'unknown')


def create_docid(row):
    t = tuple(row)
    h = md5()
    for x in t:
        h.update(str(x).encode())
    return h.hexdigest()


def transform_cards(df):
    # Extract data from the mdb's dataframe.
    # It's important to check for missing values before using them.
    df2 = DataFrame()

    df2['entry_date'] = df['F_TIMESTAMP'].apply(lambda x: x and x.isoformat() or None)

    df2['mobile_unit'] = df['IF_UM']
    df2['treatment_center'] = df['IM_UM_CT']

    df2['name'] = df['IM_NAME']
    df2['lastname'] = df['IM_LASTNAME']
    df2['prename'] = df['IM_PRENAME']
    df2['sex'] = df['IM_SEX'].apply(parse_sex)
    df2['age'] = df['IM_AGE']
    df2['year_of_birth'] = df['IM_BIRTHYEAR']
    df2['mothers_surname'] = df['IM_MERE']

    df2['village'] = df['IM_AD_VILLAGE']
    df2['province'] = df['IM_AD_PROVINCE']
    df2['ZS'] = df['IM_AD_HEALTH_ZONE']
    df2['AZ'] = df['IM_AD_HEALTH_AREA']

    df2['document_date'] = df['D_DATE'].apply(lambda x: x and x.isoformat() or None)
    df2['document_id'] = df2.apply(create_docid, axis=1)

    df2['hat_id'] = (
        df2['lastname'].fillna('').str[0:2] +
        df2['name'].fillna('').str[0:2] +
        df2['prename'].fillna('').str[0:2] +
        df2['year_of_birth'].fillna(1900).astype('str') +
        df2['mothers_surname'].fillna('').str[0:1]
    )

    df2['screening_test_result'] = df.apply(
        partial(getTestResult, screening_tests), axis=1)
    df2['confirmation_test_result'] = df.apply(
       partial(getTestResult, confirmation_tests), axis=1)
    df2['PL_test_result'] = df['DS_PL_RESULT'].apply(parse_pl_result)
    return df2
