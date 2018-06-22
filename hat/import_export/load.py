"""
Load data
---------

This module contains the load functions.

The cases load processes are done in batches and using SQL sentences that are
faster and less CPU/memory consuming than the same Django ORM methods.

If the locations load processes experiment low performance in the future they
should also be switched to the same SQL sentences.
"""
import logging

import dateutil
import pandas
from django.db import transaction
from pandas import DataFrame, concat as pandasconcat

from hat.cases.event_log import EventStats
from hat.cases.models import Case, Location
from hat.common.utils import is_int
from hat.geo.geo_finder import get_single_as_and_village
from hat.geo.models import Village, AS
from hat.patient.identify import get_or_create_patient, create_test_data
from hat.sync.models import JSONDocument, DeviceDB
from hat.users.models import Team
from .errors import handle_import_stage, ImportStage

logger = logging.getLogger(__name__)


@handle_import_stage(ImportStage.load)
@transaction.atomic
def load_cases_into_db(df: DataFrame) -> EventStats:
    """
    Loads the dataframe into postgresql cases table but also tests, patients and normalized_village

    Decides if each entry should create a new record or update an old one.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """
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
    """
    Loads the dataframe into postgresql cases table

    Decides which record should be updated with the extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

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
    """
    Loads the dataframe into postgresql location table

    Deletes all the previous location data and creates new records with the
    extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

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
    """
    Loads the dataframe into postgresql location table

    Updates current records with the entries info.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

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

def parse_date(d):
    try:
        if hasattr(d, 'to_pydatetime'): #for when d is of the timestamp type of pandas
            return d.to_pydatetime()
        else:
            return dateutil.parser.parse(d)
    except Exception as e:
        import sys
        print("Exception while parsing ", d, type(d), file=sys.stderr)

        print("The exception", e, file=sys.stderr)
        raise



db_type_mapping = {
    'IntegerField': int,
    'PositiveSmallIntegerField': int,
    'PositiveIntegerField': int,
    'DecimalField': int,
    'BooleanField': bool,
    'NullBooleanField': bool,
    'DateTimeField': parse_date,
    'ForeignKey': int,
}


def convert_to_db_type(table, column, value):
    db_type = table._meta.get_field(column).get_internal_type()
    return db_type_mapping.get(db_type, lambda x: x)(value)


def get_case_team(case):
    # if we have a mobile device, we should have a direct mapping to a team, otherwise ignore
    if case.device_id:
        try:
            device = DeviceDB.objects.get(device_id=case.device_id)
            return device.get_team()
        except DeviceDB.DoesNotExist: # Unique so won't have multiple results
            return None

    # try to guess the mobile unit, with exact match and then aliases
    if case.mobile_unit:
        try:
            return Team.objects.get(name__iexact=case.mobile_unit)
        except Team.MultipleObjectsReturned:
            print("Found multiple teams for mobile_unit", case.mobile_unit)
            return None
        except Team.DoesNotExist:
            try:
                return Team.objects.get(aliases__contains=case.mobile_unit)
            except Team.DoesNotExist:
                return None
            except Team.MultipleObjectsReturned:
                print("Found multiple teams for mobile_unit", case.mobile_unit)
                return None

    return None


def normalize_location(case):
    # If the ZS/AS are numeric, they probably are
    if is_int(case.ZS) and is_int(case.AS):
        if is_int(case.village):
            try:
                db_village = Village.objects.get(id=int(case.village))
                case.normalized_village = db_village
                case.normalized_AS = db_village.AS
            except Village.DoesNotExist:
                # We have a numeric village but it doesn't exist, strange but leave as is.
                logger.error("Received a numeric village id {} but could not find it in the db".format(case.village))
        else:
            # TODO Consider creating the village (need ability to trace the creator)
            try:
                db_as = AS.objects.get(id=int(case.AS), ZS_id=int(case.ZS))
                case.normalized_AS = db_as
            except AS.DoesNotExist:
                # We have a numeric AS/ZS but it doesn't exist, strange but leave as is.
                logger.error("Received a numeric ZS {} AS {} but could not find it in the db".format(case.ZS, case.AS))
    else:
        norm_as, norm_village = get_single_as_and_village(case.ZS, case.AS, case.village)
        if norm_as:
            case.normalized_AS_id = norm_as
        if norm_village:
            case.normalized_village_id = norm_village


def create_cases(df: DataFrame) -> None:
    for _, row in df.iterrows():
        case = Case()
        json_document_id = None
        for index, value in enumerate(row):
            column_name = df.columns[index]
            if not pandas.isnull(value) and value != '':
                if column_name == 'json_document_id':
                    # This needs to be delayed until case is saved and received an ID
                    json_document_id = value
                else:
                    setattr(case, column_name, convert_to_db_type(Case, column_name, value))

        patient, _ = get_or_create_patient(case)
        case.normalized_patient = patient
        case.normalized_team = get_case_team(case)
        normalize_location(case)

        case.save()

        if json_document_id:
            doc = JSONDocument.objects.get(id=json_document_id)
            doc.case = case
            doc.processed = True
            doc.save()

        create_test_data(case)


def update_cases(df: DataFrame) -> int:
    num_updated = 0

    for _, row in df.iterrows():
        cases = Case.objects.filter(document_id=row['document_id'])
        if cases.count() > 0:
            num_updated += 1
            case = cases[0]
            json_document_id = None
            for index, value in enumerate(row):
                column_name = df.columns[index]
                if not pandas.isnull(value) and value != '':
                    if column_name == 'json_document_id':
                        # This needs to be delayed until case is saved and received an ID
                        json_document_id = value
                    else:
                        setattr(case, column_name, convert_to_db_type(Case, column_name, value))
            case.save()

            if json_document_id:
                doc = JSONDocument.objects.get(id=json_document_id)
                doc.case = case
                doc.processed = True
                doc.save()

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
