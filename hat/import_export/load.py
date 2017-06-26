'''
Load data
---------

This module contains the load functions.

The cases load processes are done in batches and using SQL sentences that are
faster and less CPU/memory consuming than the same Django ORM methods.

If the locations load processes experiment low performance in the future they
should also be switched to the same SQL sentences.
'''

from typing import Iterator, Dict, Callable, Any
from django.db import connection, transaction
from pandas import DataFrame, concat as pandasconcat
import pandas

from hat.cases.models import Case, Location
from hat.cases.event_log import EventStats
from .errors import handle_import_stage, ImportStage


@handle_import_stage(ImportStage.load)
@transaction.atomic
def load_cases_into_db(df: DataFrame) -> EventStats:
    '''
    Loads the dataframe into postgresql cases table

    Decides if each entry should create a new record or update an old one.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    '''
    total = len(df)

    # remove rows with existing ids from the data
    ids = list(df['document_id'])
    existing_ids = Case.objects \
                       .filter(document_id__in=ids) \
                       .values_list('document_id', flat=True)

    # Filter out items that already exist in database
    duplicate_ids_in_db = df['document_id'].isin(existing_ids)
    duplicates_in_db = df[duplicate_ids_in_db]
    df = df[~duplicate_ids_in_db]

    # Filter out items that are entered 2x in the data to be inserted
    duplicate_ids_in_new_data = df.duplicated('document_id')
    duplicates_in_new_data = df[duplicate_ids_in_new_data]
    df = df[~duplicate_ids_in_new_data]

    # create a dataframe with all duplicate data
    # + drop rows that are exactly the same, since duplicate_ids
    # and duplicate_in_new_data might overlap
    duplicates = pandasconcat([duplicates_in_db, duplicates_in_new_data], axis=0) \
        .drop_duplicates()

    df['version_number'] = 0
    create_cases(df)

    # Update duplicates
    if len(duplicates) > 0:
        update_entries(duplicates)

    return EventStats(
        total=total,
        created=len(df),
        updated=len(duplicates),
        deleted=0
    )


@transaction.atomic
def load_reconciled_into_db(df: DataFrame) -> EventStats:
    '''
    Loads the dataframe into postgresql cases table

    Decides which record should be updated with the extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    '''

    total = len(df)
    updated = update_cases(df)
    return EventStats(
        total=total,
        created=0,
        updated=updated,
        deleted=0
    )


@transaction.atomic
def load_locations_into_db(df: DataFrame) -> EventStats:
    '''
    Loads the dataframe into postgresql location table

    Deletes all the previous location data and creates new records with the
    extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    '''

    total = len(df)

    locations = [Location(**row.dropna().to_dict()) for _, row in df.iterrows()]

    created = len(locations)
    deleted = Location.objects.all().count()

    # Delete all rows from the table and replaced with the new ones
    Location.objects.all().delete()
    Location.objects.bulk_create(locations)

    return EventStats(
        total=total,
        created=created,
        updated=0,
        deleted=deleted
    )


@transaction.atomic
def load_locations_areas_into_db(df: DataFrame) -> EventStats:
    '''
    Loads the dataframe into postgresql location table

    Updates current records with the entries info.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    '''

    total = len(df)
    updated = 0
    for index, row in df.iterrows():
        num = Location.objects.filter(ZS=row['ZS']) \
                              .filter(AS=row['AS']) \
                              .update(**row.dropna().to_dict())
        updated += num

    return EventStats(
        total=total,
        created=0,
        updated=updated,
        deleted=0
    )


################################################################################
# Helper functions
################################################################################


def batch_dataframe(df: DataFrame) -> Iterator[DataFrame]:
    # Helper generator function that yields slices of a DataFrame
    if len(df) > 0:
        size = 1000
        start = 0
        while True:
            end = start + size
            df2 = df[start:end]
            if len(df2) == 0:
                raise StopIteration
            start = end
            yield df2


def get_columns_mapping(df: DataFrame) -> Dict[str, Callable[[Any], str]]:
    # Some values need quoting when we want to insert them with sql.
    # We create a mapping from column names to quoting function
    mapping = {}

    for column in list(df.columns):
        # use Case model to get real column types
        propertyType = Case._meta.get_field(column).get_internal_type()

        if not (propertyType.endswith('IntegerField') or
                propertyType.endswith('DecimalField') or
                propertyType.endswith('BooleanField')):
            mapping[column] = lambda x: "$${}$$".format(x)

    return mapping


def create_cases(df: DataFrame) -> None:
    mapping = get_columns_mapping(df)
    columns = list(df.columns)
    sql_columns = ','.join([('"' + c + '"') for c in columns])

    with connection.cursor() as cursor:
        for df2 in batch_dataframe(df):
            # Create a sql string that inserts multiple rows as value tuples
            sql = '''
                INSERT INTO cases_case ({})
                VALUES
            '''.format(sql_columns)
            sql_values = []
            for _, row in df2.iterrows():
                index = 0
                values = []
                for v in row:
                    name = str(df2.columns[index])
                    index = index + 1
                    # treat null and empty strings as null
                    if pandas.isnull(v) or v == '':
                        values.append('NULL')
                    elif name in mapping:
                        values.append(mapping[name](v))
                    else:
                        values.append(str(v))
                sql_values.append('(' + ','.join(values) + ')')

            sql = sql + ','.join(sql_values) + ';'
            cursor.execute(sql)


def update_cases(df: DataFrame) -> int:
    mapping = get_columns_mapping(df)
    num_updated = 0
    with connection.cursor() as cursor:
        for df2 in batch_dataframe(df):
            sql_updates = []

            # Check if the cases exist. Skip non-existing
            ids = list(df2['document_id'].values)
            sql = '''
                SELECT document_id
                FROM cases_case
                WHERE document_id IN ({})
            '''.format(','.join("'{}'".format(i) for i in ids))
            cursor.execute(sql)
            existing_ids = [i for (i,) in cursor.fetchall()]

            for _, row in df2.iterrows():
                if str(row['document_id']) not in existing_ids:
                    continue
                num_updated += 1
                values = []
                index = 0
                for v in row:
                    name = str(df2.columns[index])
                    index = index + 1
                    if pandas.isnull(v):
                        continue
                    elif name in mapping:
                        value = mapping[name](v)
                    else:
                        value = str(v)
                    values.append('"{}"={}'.format(name, value))
                sql_updates.append('''
                    UPDATE cases_case
                    SET {}
                    WHERE document_id = '{}';
                '''.format(','.join(values), row['document_id']))

            if len(sql_updates) == 0:
                continue
            sql = ';'.join(sql_updates)
            cursor.execute(sql)
    return num_updated


def update_entries(duplicates: DataFrame) -> int:
    # remove unwanted columns
    # we only want to add test results:
    duplicates.drop(
        [
            # meta fields, keep original
            'source',
            'entry_date',
            'document_date',
            'entry_name',
            'mobile_unit',
            'form_number',
            'form_month',
            'form_year',
            # already the same
            'village',
            'province',
            'ZS',
            'AS',
            'hat_id',
            'name',
            'lastname',
            'prename',
            'sex',
            'age',
            'year_of_birth',
            'mothers_surname',
        ],
        inplace=True,
        axis=1,
        # ignore if some columns don't exist
        errors='ignore'
    )
    return update_cases(duplicates)
