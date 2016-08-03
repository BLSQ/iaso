from hashlib import md5
import pandas
import numpy


def tz_localize_cd(s: pandas.Series) -> pandas.Series:
    ''' Add a DR Congo timezone to the pandas series '''
    def localize(x):
        if pandas.isnull(x):
            return numpy.datetime64('nat')
        return x.tz_localize('Africa/Kinshasa')
    return pandas.to_datetime(s).apply(localize)


def hash_df_row(row: pandas.Series) -> str:
    ''' Return a hash of a pandas dataframe row '''
    t = tuple(row)
    h = md5()
    for x in t:
        h.update(str(x).encode())
    return h.hexdigest()
