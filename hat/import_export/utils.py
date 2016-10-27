from hashlib import md5
from string import capwords
from functools import reduce
import re
import pandas
from pandas import Series, DataFrame


def capitalize(x: str) -> str:
    if pandas.isnull(x):
        return None
    return capwords(x)


def create_documentid(row: Series) -> str:
    ''' Hash some columns to create the document id '''
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


def groupreduce(df: DataFrame, column: str, sortby=None) -> DataFrame:
    '''
    Group a dataframe by column value and then reduce each group column to the
    last non null value. This is lossy in that it discards values which are not
    null and not the last one in the column.

    Example: reduce_df(df, 'id')
    | id   | a    | b   |           | id | a  | b  |
    |------|------|-----|     ==>   |----|----|----|
    | 1    | 11   | 22  |           | 1  | 11 | 23 |
    | 1    | null | 23  |           | 2  | 33 | 44 |
    | 2    | 33   | 44  |
    '''
    result = df.sort_values(by=sortby) if sortby else df
    return result.groupby(column) \
                 .agg(lambda x: reduce(lambda a, b: b or a, x))


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
