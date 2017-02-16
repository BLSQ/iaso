import logging
from django.db import transaction
from django.utils.translation import ugettext as _
from pandas import DataFrame
from simpledbf import Dbf5

from .errors import ImportStage
from .load import load_locations_into_db, load_locations_areas_info_db
from .models import ImportLog
from .utils import extract_raw_file, capitalize, get_property_by_year

logger = logging.getLogger(__name__)

STORE_ID = 'hat-raw-locations'
AREAS_ID = 'hat-raw-locations-areas'

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
def import_locations_file(orgname: str, filename: str, store=False) -> dict:
    '''
    This method receives the COMPLETE villages list.
    It will trucate the "location" table and insert the new entries.
    '''

    if ImportLog.objects.filter(file_hash=STORE_ID).exists():
        import_log = ImportLog.objects.filter(file_hash=STORE_ID).first()
    else:
        import_log = ImportLog()
        import_log.source = 'locations_areas_import'
        import_log.mimetype = 'application/x-dbf'
        import_log.filename = orgname
        import_log.file_hash = STORE_ID

    stats = {
        'typename': _('locations'),
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'log': import_log,
        'num_with_population': 0,
    }

    try:
        dbf = Dbf5(filename)
        df = dbf.to_dataframe()

        import_log.num_total = len(df)

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

        stats['num_with_population'] = len(df_locs[df_locs['population'].notnull()])
        load_locations_into_db(df_locs)

        # We store the locations so that they can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            import_log.content = extract_raw_file(filename)
            import_log.extra_stats = str({'num_with_population': stats['num_with_population']})
            import_log.save()

    except KeyError as ke:
        stats['errors'].append({'stage': ImportStage.transform.name, 'message':  str(ke)})
        logger.exception(ke)

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats


def import_locations_areas_file(orgname: str, filename: str, store=False) -> dict:
    '''
    This method receives the HEALTH AREAS list, it can be INCOMPLETE but not recommended.
    It will update the missing province "info" in the "location" table entries.
    No new entries will be created, either other properties will be updated.
    '''

    if ImportLog.objects.filter(file_hash=AREAS_ID).exists():
        import_log = ImportLog.objects.filter(file_hash=AREAS_ID).first()
    else:
        import_log = ImportLog()
        import_log.source = 'locations_areas_import'
        import_log.mimetype = 'application/x-dbf'
        import_log.filename = orgname
        import_log.file_hash = AREAS_ID

    stats = {
        'typename': _('health areas'),
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'errors': [],
        'log': import_log,
    }

    try:
        dbf = Dbf5(filename)
        df = dbf.to_dataframe()

        import_log.num_total = len(df)

        df_locs = DataFrame()
        df_locs['province'] = df['NEW_PROV'].apply(capitalize)
        df_locs['province_old'] = df['OLD_PROV'].apply(capitalize)
        df_locs['ZS'] = df['ZS'].apply(capitalize)
        df_locs['AS'] = df['AS_'].apply(capitalize)

        load_locations_areas_info_db(df_locs)

        # We store the areas so that they can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            import_log.content = extract_raw_file(filename)
            import_log.save()

    except KeyError as ke:
        stats['errors'].append({'stage': ImportStage.transform.name, 'message':  str(ke)})
        logger.exception(ke)

    except Exception as ex:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(ex)})
        logger.exception(ex)

    return stats


def population_value(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='value')


def population_year(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='year')
