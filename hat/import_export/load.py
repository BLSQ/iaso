from django.db import connection, transaction
from pandas import DataFrame, concat as pandasconcat
import pandas

from hat.cases.models import Case, Location
from .errors import handle_import_stage, ImportStage
from hat.cases.event_log import EventStats


def batch_dataframe(df):
    ''' Helper generator function that yields slices of a DataFrame '''
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


@handle_import_stage(ImportStage.load)
@transaction.atomic
def load_cases_into_db(df: DataFrame) -> EventStats:
    '''Load the dataframe into postgres'''
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

    columns = list(df.columns) + ['version_number']
    sql_columns = ','.join([('"' + c + '"') for c in columns])

    # Some values need quoting. We create a mapping from column names to quoting function
    mapping = {}
    i = 0
    for dt in df.dtypes:
        dts = str(dt).lower()
        name = str(df.columns[i])
        if not (dts.startswith('int') or
                dts.startswith('float') or
                dts.startswith('bool')):
            mapping[name] = lambda x: "$${}$$".format(x)
        i = i + 1

    with connection.cursor() as cursor:
        for df2 in batch_dataframe(df):
            # Create a sql string that inserts multiple rows as value tuples
            sql = '''
                INSERT INTO cases_case ({})
                VALUES
            '''.format(sql_columns)
            sql_values = []
            for _, row in df2.iterrows():
                column_index = 0
                values = []
                for v in row:
                    column_name = columns[column_index]
                    column_index = column_index + 1
                    if pandas.isnull(v):
                        values.append('NULL')
                    elif column_name in mapping:
                        values.append(mapping[column_name](v))
                    else:
                        values.append(str(v))

                # append the version number
                values.append('0')
                sql_values.append('(' + ','.join(values) + ')')

            sql = sql + ','.join(sql_values) + ';'
            cursor.execute(sql)

    # Update duplicates
    if len(duplicates) > 0:
        update_entries(duplicates, mapping)

    return EventStats(
        total=total,
        created=len(df),
        updated=len(duplicates),
        deleted=0
    )


def update_entries(duplicates, mapping):
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
        # ignore if some columns dont exist
        errors='ignore'
    )

    with connection.cursor() as cursor:
        for df2 in batch_dataframe(duplicates):
            sql_updates = []
            for _, row in df2.iterrows():
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
                    values.append('{}={}'.format(name, value))
                sql_updates.append('''
                    UPDATE cases_case
                    SET {}
                    WHERE document_id = '{}';
                '''.format(','.join(values), row['document_id']))

            sql = ';'.join(sql_updates)
            cursor.execute(sql)


@transaction.atomic
def load_locations_into_db(df: DataFrame) -> EventStats:
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


@transaction.atomic
def load_reconciled_into_db(df: DataFrame) -> EventStats:
    total = len(df)
    updated = 0
    for index, row in df.iterrows():
        num = Case.objects.filter(document_id=row['document_id']) \
                          .update(**row.dropna().to_dict())
        updated += num
    return EventStats(
        total=total,
        created=0,
        updated=updated,
        deleted=0
    )
