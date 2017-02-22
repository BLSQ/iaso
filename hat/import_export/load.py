from django.db import transaction
from pandas import DataFrame, concat as pandasconcat

from hat.cases.models import Case, Location
from .errors import handle_import_stage, ImportStage
from hat.cases.event_log import EventStats


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

    # Insert new docs
    if len(df) > 0:
        cases = [Case(**row.dropna().to_dict()) for _, row in df.iterrows()]
        Case.objects.bulk_create(cases)

    # Update duplicates
    if len(duplicates) > 0:
        update_entries(duplicates)

    # stats.created = len(df)
    # stats.updated = len(duplicates)
    # return stats
    return EventStats(
        total=total,
        created=len(df),
        updated=len(duplicates),
        deleted=0
    )


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
def load_locations_areas_info_db(df: DataFrame) -> EventStats:
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


def update_entries(duplicates):
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

    for index, row in duplicates.iterrows():
        Case.objects.filter(document_id=row['document_id']) \
                    .update(**row.dropna().to_dict())
