from hashlib import md5
from string import capwords
import pandas
import numpy


def capitalize(x: str) -> str:
    if x is None:
        return None
    return capwords(x)


def tz_localize_cd(s: pandas.Series) -> pandas.Series:
    ''' Add a DR Congo timezone to the pandas series '''
    def localize(x):
        if pandas.isnull(x):
            return numpy.datetime64('nat')
        return x.tz_localize('Africa/Kinshasa')
    return pandas.to_datetime(s).apply(localize)


def create_documentid(row: pandas.Series) -> str:
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
