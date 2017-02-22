import logging
from django.db import transaction
from django.utils.translation import ugettext as _
from pandas import DataFrame
from simpledbf import Dbf5

from .errors import get_import_error
from .load import load_locations_into_db, load_locations_areas_info_db
from .utils import capitalize, get_property_by_year


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
def import_locations_file(orgname: str, filename: str) -> dict:
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
        logger.exception(ex)
        result['error'] = ex

    return result


def import_locations_areas_file(orgname: str, filename: str) -> dict:
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

        stats = load_locations_areas_info_db(df_locs)
        result['stats'] = stats

    except Exception as ex:
        logger.exception(ex)
        result['error'] = get_import_error(ex)

    return result


def population_value(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='value')


def population_year(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='year')
