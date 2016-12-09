import logging
from simpledbf import Dbf5
from pandas import DataFrame
from django.conf import settings
import hat.couchdb.api as couchdb
from .load import load_locations_into_db
from .utils import store_raw_file, capitalize, get_property_by_year

logger = logging.getLogger(__name__)

STORE_ID = 'hat-raw-locations'


def import_locations_file(orgname: str, filename: str, store=False) -> dict:
    stats = {
        'type': 'locations_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'success': True,
        'num_total': 0,
        'num_imported': 0,
        'num_with_population': 0,
        'error': None
    }
    try:
        dbf = Dbf5(filename)
        df = dbf.to_dataframe()

        stats['num_total'] = len(df)

        df_locs = DataFrame()
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

        df_imported = load_locations_into_db(df_locs)
        stats['num_imported'] = len(df_imported)

        # We store the locations so that they can be replicated to another
        # server and get inserted when we reimport from raw data.
        if store:
            # Check if a locations raw file already exists and delete it
            r = couchdb.get(settings.COUCHDB_DB + '/' + STORE_ID)
            if r.status_code < 400:
                old_doc = r.json()
                couchdb.delete(settings.COUCHDB_DB + '/' + STORE_ID,
                               params={'rev': old_doc['_rev']})
            doc = stats.copy()
            doc['_id'] = STORE_ID
            store_raw_file(doc, filename, 'application/x-dbf')
            stats['store_id'] = STORE_ID

    except Exception as ex:
        stats['success'] = False
        stats['error'] = str(ex)
        logger.exception(ex)

    return stats


def population_value(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='value')


def population_year(row) -> str:
    return get_property_by_year(row, prefix='POP_', returnType='year')
