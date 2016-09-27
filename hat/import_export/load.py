from base64 import b64encode
from pandas import DataFrame, concat as pandasconcat
from django.conf import settings
from django.db import transaction
from hat.cases.models import Case
import hat.couchdb.api as couchdb
from hat.import_export.errors import handle_import_stage, ImportStage


@handle_import_stage(ImportStage.store)
def store_file(doc: dict, filename: str, mimetype: str) -> str:
    with open(filename, 'rb') as file:
        doc['_attachments'] = {
            'file': {
                'content_type': mimetype,
                'data': b64encode(file.read()).decode('ascii')
            }
        }
    r = couchdb.post(settings.COUCHDB_DB, json=doc)
    r.raise_for_status()
    return r.json()['id']


@handle_import_stage(ImportStage.load)
def load_into_db(df: DataFrame) -> DataFrame:
    '''Load the dataframe into postgres'''

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

    return df


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
            'AZ',
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

    # Use a transaction to bundle updates for better performance
    with transaction.atomic():
        for index, row in duplicates.iterrows():
            Case.objects.filter(document_id=row['document_id']) \
                        .update(**row.dropna().to_dict())
