from base64 import b64encode
from pandas import DataFrame, concat as pandasconcat
from django.conf import settings
from hat.cases.models import HatCase
from hat.common.sqlalchemy import engine
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
    existing_ids = HatCase.objects \
                          .filter(document_id__in=ids) \
                          .values_list('document_id', flat=True)

    # Filter out items that already exist in database
    duplicate_ids = df['document_id'].isin(existing_ids)

    # Filter out items that are entered 2x in the data to be inserted
    duplicate_in_new_data = df.duplicated('document_id')

    # create a dataframe with all duplicate data
    # + drop rows that are exactly the same, since duplicate_ids
    # and duplicate_in_new_data might overlap
    duplicates = pandasconcat([df[duplicate_ids], df[duplicate_in_new_data]], axis=0) \
        .drop_duplicates()

    # Only insert new docs via pandas
    # TODO: This raises a warning
    df = df[~duplicate_ids]
    df = df[~duplicate_in_new_data]

    table_name = HatCase.objects.model._meta.db_table
    if len(df) > 0:
        with engine.begin() as conn:
            df.to_sql(table_name, conn, if_exists='append', index=False)

    if len(duplicates) > 0:
        update_entries(duplicates)

    return df


def update_entries(duplicates):
    ids = list(duplicates['document_id'])

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

    records = HatCase.objects.filter(document_id__in=ids)

    for index, row in duplicates.iterrows():
        records \
            .filter(document_id=row['document_id']) \
            .update(**row.dropna().to_dict())
