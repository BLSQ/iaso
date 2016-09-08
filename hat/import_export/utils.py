from hashlib import md5
from string import capwords
from functools import reduce
import pandas
from pandas import Series, DataFrame
import numpy


def capitalize(x: str) -> str:
    if x is None:
        return None
    return capwords(x)


def tz_localize_cd(s: Series) -> Series:
    ''' Add a DR Congo timezone to the pandas series '''
    def localize(x):
        if pandas.isnull(x):
            return numpy.datetime64('nat')
        return x.tz_localize('Africa/Kinshasa')
    return pandas.to_datetime(s).apply(localize)


def create_documentid(row: Series) -> str:
    ''' Hash some columns to create the document id '''
    COLUMNS = [
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


def hat_id(row: Series) -> str:
    empty = 'XX'
    if numpy.isnan(row['year_of_birth']):
        yob = 1900
    else:
        yob = row['year_of_birth']

    return (
        (row['lastname'] or empty)[0:2] +
        (row['name'] or empty)[0:2] +
        (row['prename'] or empty)[0:2] +
        (row['sex'] or empty)[0:1] +
        # had a problem with YOB being read as float
        str(yob)[0:4] +
        (row['mothers_surname'] or empty)[0:1]
    ).upper()
