from typing import Optional
from .typing import ImportResult

import logging
from django.db import transaction
from django.utils.translation import ugettext as _
from pandas import DataFrame, Series, notnull
from simpledbf import Dbf5

from .errors import get_import_error
from .load import load_locations_into_db, load_locations_areas_into_db
from .utils import capitalize


logger = logging.getLogger(__name__)

'''
    ** import_locations_file
    This method receives the COMPLETE villages list.
    It will trucate the "location" table and insert the new entries.

    ** import_locations_areas_file
    This method receives the HEALTH AREAS list, it can be INCOMPLETE but not recommended.
    It will update the missing "province" info in the "location" table entries.
    No new entries will be created, either other properties will be updated.
'''


@transaction.atomic
def import_locations_file(orgname: str, filename: str) -> ImportResult:
    '''
    This method receives the COMPLETE villages list.
    It will trucate the "location" table and insert the new entries.
    '''
    result = {
        'typename': _('locations'),
        'orgname': orgname,
        'filename': filename,
        'error': None,
        'stats': None,
        'num_with_population': 0,
    }

    try:
        dbf = Dbf5(filename)
        df = dbf.to_dataframe()

        df_locs = DataFrame()
        # this is not possible yet, that's the main reason of the other method
        # df_locs['province'] = df['NEW_PROV'].apply(capitalize)
        # df_locs['province_old'] = df['OLD_PROV'].apply(capitalize)
        df_locs['ZS'] = df['ZS'].apply(capitalize)
        df_locs['AS'] = df['AS_'].apply(capitalize)
        if 'Alt_AS' in df:
            df_locs['AS_alt'] = df['Alt_AS'].apply(capitalize)
        df_locs['village'] = df['VILLAGE_NA'].apply(capitalize)
        if 'ALT_VILLAG'in df:
            df_locs['village_alt'] = df['ALT_VILLAG'].apply(capitalize)
        if 'VILLAGE_TY' in df:
            df_locs['village_type'] = df['VILLAGE_TY']
        elif 'TYPE' in df:
            df_locs['village_type'] = df['TYPE']
        df_locs['village_official'] = df['LIST_OFF']

        df_locs['latitude'] = df['LAT']
        df_locs['longitude'] = df['LON']
        df_locs['gps_source'] = df['GPS_SOURCE']

        df_locs['population'] = df.apply(population_value, axis=1)
        df_locs['population_year'] = df.apply(population_year, axis=1)
        df_locs['population_source'] = df['POP_SOURCE']

        result['num_with_population'] = len(df_locs[df_locs['population'].notnull()])
        stats = load_locations_into_db(df_locs)
        result['stats'] = stats

    except Exception as ex:
        logger.exception(str(ex))
        result['error'] = ex

    return result


def import_locations_areas_file(orgname: str, filename: str) -> ImportResult:
    '''
    This method receives the HEALTH AREAS list, it can be INCOMPLETE but not recommended.
    It will update the missing province "info" in the "location" table entries.
    No new entries will be created, either other properties will be updated.
    '''
    result = {
        'typename': _('health areas'),
        'orgname': orgname,
        'filename': filename,
        'error': None,
        'stats': None
    }

    try:
        dbf = Dbf5(filename)
        df = dbf.to_dataframe()

        df_locs = DataFrame()
        df_locs['province'] = df['NEW_PROV'].apply(capitalize)
        df_locs['province_old'] = df['OLD_PROV'].apply(capitalize)
        df_locs['ZS'] = df['ZS'].apply(capitalize)
        df_locs['AS'] = df['AS_'].apply(capitalize)

        stats = load_locations_areas_into_db(df_locs)
        result['stats'] = stats

    except Exception as ex:
        logger.exception(str(ex))
        result['error'] = get_import_error(ex)

    return result


def population_value(row: Series) -> Optional[int]:
    return get_property_by_year(row, prefix='POP_', returnType='value')


def population_year(row: Series) -> Optional[int]:
    return get_property_by_year(row, prefix='POP_', returnType='year')


def get_property_by_year(row: Series,
                         prefix: str='',
                         returnType: str='value') -> Optional[int]:
    import datetime
    currentYear = datetime.date.today().year
    # the first year is `2000` but the `range` method is exclusive
    firstYear = 1999

    # iterate through the years in reverse order,
    # last years are more "meaningful" than previous ones
    for year in range(currentYear, firstYear, -1):
        key = prefix + str(year)
        if key in row and notnull(row[key]):
            if returnType == 'value':
                return row[key]
            else:
                return year
    return None
